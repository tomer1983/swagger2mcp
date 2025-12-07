import { prisma } from '../lib/db';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

interface ConfigItem {
  key: string;
  value: string;
  category: string;
  updatedAt: Date;
}

interface GroupedConfig {
  [category: string]: { key: string; value: any }[];
}

// Default configuration values
const DEFAULT_CONFIG: Record<string, { value: string; category: string }> = {
  'observability.pollingInterval': { value: '2000', category: 'observability' },
  'audit.retentionDays': { value: '30', category: 'system' },
  'auth.entraId.enabled': { value: 'false', category: 'auth' },
  'auth.entraId.tenantId': { value: '', category: 'auth' },
  'auth.entraId.clientId': { value: '', category: 'auth' },
  'auth.entraId.clientSecret': { value: '', category: 'auth' },
  'generation.defaultLanguage': { value: 'typescript', category: 'generation' },
  'system.maxUploadSize': { value: '10485760', category: 'system' },
  'system.maxCrawlDepth': { value: '3', category: 'system' },
};

class ConfigService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 60 * 1000; // 60 seconds

  /**
   * Get a config value with caching
   */
  async get(key: string, defaultValue?: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Fetch from database
    const config = await prisma.config.findUnique({
      where: { key },
    });

    if (config) {
      // Cache the value
      this.cache.set(key, {
        value: config.value,
        expiresAt: Date.now() + this.CACHE_TTL,
      });
      return config.value;
    }

    // Return default value from defaults or parameter
    const defaultFromConfig = DEFAULT_CONFIG[key]?.value;
    return defaultValue ?? defaultFromConfig ?? '';
  }

  /**
   * Get a config value as a number
   */
  async getNumber(key: string, defaultValue: number): Promise<number> {
    const value = await this.get(key);
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get a config value as a boolean
   */
  async getBoolean(key: string, defaultValue: boolean): Promise<boolean> {
    const value = await this.get(key);
    if (value === '') return defaultValue;
    return value === 'true';
  }

  /**
   * Set a config value
   */
  async set(key: string, value: string, category?: string): Promise<void> {
    const cat = category ?? DEFAULT_CONFIG[key]?.category ?? 'system';
    
    await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value, category: cat },
    });

    // Invalidate cache for this key
    this.cache.delete(key);
  }

  /**
   * Set multiple config values at once
   */
  async setMany(configs: Record<string, string>): Promise<void> {
    const updates = Object.entries(configs).map(([key, value]) => {
      const category = DEFAULT_CONFIG[key]?.category ?? 'system';
      return prisma.config.upsert({
        where: { key },
        update: { value },
        create: { key, value, category },
      });
    });

    await prisma.$transaction(updates);

    // Invalidate cache for all updated keys
    Object.keys(configs).forEach(key => this.cache.delete(key));
  }

  /**
   * Get all config items in a category
   */
  async getByCategory(category: string): Promise<ConfigItem[]> {
    return prisma.config.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get all config items grouped by category
   */
  async getAll(): Promise<GroupedConfig> {
    const configs = await prisma.config.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Group by category
    const grouped: GroupedConfig = {};
    for (const config of configs) {
      if (!grouped[config.category]) {
        grouped[config.category] = [];
      }
      // Try to parse JSON values, fall back to raw string
      let parsedValue: any = config.value;
      try {
        parsedValue = JSON.parse(config.value);
      } catch {
        // Keep as string if not valid JSON
      }
      grouped[config.category].push({
        key: config.key,
        value: parsedValue,
      });
    }

    // Add defaults for any missing keys
    for (const [key, def] of Object.entries(DEFAULT_CONFIG)) {
      if (!grouped[def.category]) {
        grouped[def.category] = [];
      }
      const exists = grouped[def.category].some(c => c.key === key);
      if (!exists) {
        let parsedValue: any = def.value;
        try {
          parsedValue = JSON.parse(def.value);
        } catch {
          // Keep as string
        }
        grouped[def.category].push({
          key,
          value: parsedValue,
        });
      }
    }

    return grouped;
  }

  /**
   * Invalidate cache for a specific key or all keys
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Seed default configuration values (run on startup)
   */
  async seedDefaults(): Promise<void> {
    try {
      const existingKeys = await prisma.config.findMany({
        select: { key: true },
      });
      const existingKeySet = new Set(existingKeys.map((c: { key: string }) => c.key));

      const toCreate = Object.entries(DEFAULT_CONFIG)
        .filter(([key]) => !existingKeySet.has(key))
        .map(([key, { value, category }]) => ({
          key,
          value,
          category,
        }));

      if (toCreate.length > 0) {
        await prisma.config.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        console.log(`Seeded ${toCreate.length} default config values`);
      }
    } catch (error: any) {
      // Log but don't throw - allow server to start even if seeding fails
      console.error('Config seed error:', error.message);
    }
  }
}

export const configService = new ConfigService();
