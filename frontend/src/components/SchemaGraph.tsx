import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    Position,
    Background,
    Controls,
    MiniMap,
    Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { EndpointDetailsPanel } from './EndpointDetailsPanel';

// Node Types
const nodeDefaults = {
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
};

// Layout Utils
const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 220, height: 60 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - 110,
                y: nodeWithPosition.y - 30,
            },
        };
    });

    return { nodes: newNodes, edges };
};

interface SchemaGraphProps {
    spec: any;
    searchQuery?: string;
}

interface EndpointData {
    method: string;
    path: string;
    summary?: string;
    description?: string;
    parameters?: any[];
    requestBody?: any;
    responses?: Record<string, any>;
    tags?: string[];
}

export const SchemaGraph: React.FC<SchemaGraphProps> = ({ spec, searchQuery = '' }) => {
    const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointData | null>(null);
    const flowRef = useRef<HTMLDivElement>(null);

    // Parse OpenAPI Spec into Nodes/Edges
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: any[] = [];
        const edges: any[] = [];

        if (!spec) return { nodes: [], edges: [] };

        const lowerQuery = searchQuery.toLowerCase();

        // Root Node
        nodes.push({
            id: 'root',
            type: 'input',
            data: { label: spec.info?.title || 'API Root' },
            position: { x: 0, y: 0 },
            style: {
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 0 20px -5px var(--primary)'
            },
            ...nodeDefaults
        });

        // Tags as Categories
        const tags = new Set<string>();

        // Process Paths
        if (spec.paths) {
            Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
                Object.entries(methods).forEach(([method, details]: [string, any]) => {
                    if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].indexOf(method) === -1) return;

                    const nodeId = `${method.toUpperCase()} ${path}`;
                    const tag = details.tags?.[0] || 'default';
                    tags.add(tag);

                    // Check if matches search
                    const matchesSearch = !searchQuery ||
                        path.toLowerCase().includes(lowerQuery) ||
                        method.toLowerCase().includes(lowerQuery) ||
                        (details.summary?.toLowerCase().includes(lowerQuery)) ||
                        (details.operationId?.toLowerCase().includes(lowerQuery));

                    // Store full endpoint data
                    const endpointData: EndpointData = {
                        method: method.toUpperCase(),
                        path,
                        summary: details.summary,
                        description: details.description,
                        parameters: details.parameters,
                        requestBody: details.requestBody,
                        responses: details.responses,
                        tags: details.tags
                    };

                    // Method color
                    const methodColors: Record<string, string> = {
                        GET: '#22c55e',
                        POST: '#3b82f6',
                        PUT: '#eab308',
                        PATCH: '#f97316',
                        DELETE: '#ef4444'
                    };

                    // Add Endpoint Node
                    nodes.push({
                        id: nodeId,
                        data: {
                            label: `${method.toUpperCase()} ${path}`,
                            endpoint: endpointData
                        },
                        position: { x: 0, y: 0 },
                        style: {
                            background: matchesSearch ? 'var(--card)' : 'var(--muted)',
                            color: matchesSearch ? 'var(--card-foreground)' : 'var(--muted-foreground)',
                            border: `2px solid ${matchesSearch ? (methodColors[method.toUpperCase()] || 'var(--border)') : 'var(--border)'}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            width: 250,
                            opacity: matchesSearch ? 1 : 0.4,
                            cursor: 'pointer'
                        },
                        ...nodeDefaults
                    });

                    // Connect to Tag
                    edges.push({
                        id: `e-${tag}-${nodeId}`,
                        source: tag,
                        target: nodeId,
                        animated: matchesSearch,
                        style: {
                            stroke: matchesSearch ? 'var(--primary)' : 'var(--border)',
                            opacity: matchesSearch ? 1 : 0.3
                        }
                    });
                });
            });
        }

        // Create Tag Nodes
        tags.forEach(tag => {
            const tagMatchesSearch = !searchQuery || tag.toLowerCase().includes(lowerQuery);

            nodes.push({
                id: tag,
                data: { label: tag },
                position: { x: 0, y: 0 },
                style: {
                    background: 'var(--secondary)',
                    color: 'var(--secondary-foreground)',
                    border: '1px solid var(--secondary)',
                    fontWeight: 'bold',
                    opacity: tagMatchesSearch || !searchQuery ? 1 : 0.4
                },
                ...nodeDefaults
            });

            edges.push({
                id: `e-root-${tag}`,
                source: 'root',
                target: tag,
                type: 'smoothstep',
                style: { stroke: 'var(--primary)', strokeWidth: 2 }
            });
        });

        return getLayoutedElements(nodes, edges);
    }, [spec, searchQuery]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Re-layout if spec or search changes
    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    // Handle node click
    const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
        if (node.data?.endpoint) {
            setSelectedEndpoint(node.data.endpoint);
        }
    }, []);

    // Export to PNG
    const handleExport = useCallback(() => {
        if (!flowRef.current) return;

        const viewport = flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) return;

        toPng(viewport, {
            backgroundColor: '#0a0a0f',
            quality: 1,
            pixelRatio: 2
        }).then((dataUrl) => {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${spec?.info?.title || 'api'}-schema-graph.png`;
            a.click();
        }).catch((err) => {
            console.error('Failed to export image:', err);
        });
    }, [spec]);

    return (
        <>
            <div ref={flowRef} className="w-full h-[600px] glass-card rounded-xl overflow-hidden border border-border relative">
                {nodes.length > 0 ? (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        fitView
                        attributionPosition="bottom-right"
                        colorMode="system"
                    >
                        <Background color="var(--muted-foreground)" gap={20} size={1} />
                        <Controls className="bg-background border-border" />
                        <MiniMap
                            nodeStrokeColor={(n) => {
                                if (n.style?.background) return n.style.background as string;
                                return 'var(--muted-foreground)';
                            }}
                            nodeColor={(n) => {
                                if (n.style?.background) return n.style.background as string;
                                return 'var(--background)';
                            }}
                            className="glass border border-border"
                        />
                        <Panel position="top-right" className="flex gap-2">
                            <Button
                                onClick={handleExport}
                                variant="secondary"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export PNG
                            </Button>
                        </Panel>
                    </ReactFlow>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No schema data to visualize</p>
                    </div>
                )}
            </div>

            {/* Endpoint Details Side Panel */}
            <EndpointDetailsPanel
                endpoint={selectedEndpoint}
                onClose={() => setSelectedEndpoint(null)}
            />
        </>
    );
};
