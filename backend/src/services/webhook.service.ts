import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../lib/db';

export type WebhookEvent = 'job.completed' | 'job.failed' | 'schema.created' | 'schema.updated';

export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: Record<string, any>;
}

export class WebhookService {
    /**
     * Trigger webhooks for a specific event and session
     */
    async triggerWebhooks(sessionId: string, event: WebhookEvent, data: Record<string, any>): Promise<void> {
        try {
            const webhooks = await prisma.webhook.findMany({
                where: {
                    sessionId,
                    active: true,
                    events: {
                        has: event,
                    },
                },
            });

            if (webhooks.length === 0) {
                return;
            }

            const payload: WebhookPayload = {
                event,
                timestamp: new Date().toISOString(),
                data,
            };

            // Send webhooks in parallel but don't wait for completion
            await Promise.allSettled(
                webhooks.map(webhook => this.sendWebhook(webhook.url, payload, webhook.secret || undefined))
            );
        } catch (error) {
            console.error('Failed to trigger webhooks:', error);
        }
    }

    /**
     * Send a single webhook request
     */
    private async sendWebhook(url: string, payload: WebhookPayload, secret?: string): Promise<void> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'Swagger2MCP-Webhook/1.0',
            'X-Webhook-Event': payload.event,
            'X-Webhook-Delivery': crypto.randomUUID(),
        };

        // Add HMAC signature if secret is provided
        if (secret) {
            const body = JSON.stringify(payload);
            const signature = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex');
            headers['X-Webhook-Signature'] = `sha256=${signature}`;
        }

        try {
            await axios.post(url, payload, {
                headers,
                timeout: 10000, // 10 second timeout
            });
            console.log(`Webhook delivered to ${url} for event ${payload.event}`);
        } catch (error: any) {
            console.error(`Webhook delivery failed to ${url}:`, error.message);
            // Could implement retry logic or dead letter queue here
        }
    }

    /**
     * Helper to trigger job completed event
     */
    async onJobCompleted(sessionId: string, jobId: string, type: string, result?: any): Promise<void> {
        await this.triggerWebhooks(sessionId, 'job.completed', {
            jobId,
            type,
            result,
        });
    }

    /**
     * Helper to trigger job failed event
     */
    async onJobFailed(sessionId: string, jobId: string, type: string, error: string): Promise<void> {
        await this.triggerWebhooks(sessionId, 'job.failed', {
            jobId,
            type,
            error,
        });
    }

    /**
     * Helper to trigger schema created event
     */
    async onSchemaCreated(sessionId: string, schemaId: string, title?: string): Promise<void> {
        await this.triggerWebhooks(sessionId, 'schema.created', {
            schemaId,
            title,
        });
    }

    /**
     * Helper to trigger schema updated event
     */
    async onSchemaUpdated(sessionId: string, schemaId: string, version: number): Promise<void> {
        await this.triggerWebhooks(sessionId, 'schema.updated', {
            schemaId,
            version,
        });
    }
}

export const webhookService = new WebhookService();
