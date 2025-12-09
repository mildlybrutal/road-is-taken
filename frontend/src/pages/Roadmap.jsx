import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType, Handle, Position } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import api from "../utils/api";
import { Loader2, ArrowLeft, CheckCircle, Lock, CircleDashed, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/Button";
import { clsx } from "clsx";
import DetailModal from "../components/Roadmap/DetailModal";
import dagre from 'dagre';

// Custom Node Component
const CustomNode = ({ data }) => {
    // Styles inspired by the reference image (blocky, distinct colors)
    const statusStyles = {
        completed: "bg-[#10b981] border-[#047857] text-white shadow-lg shadow-emerald-900/20",
        pending: "bg-[#fbbf24] border-[#d97706] text-black shadow-lg shadow-yellow-900/20", // Yellow for current focus
        locked: "bg-[#1e293b] border-[#334155] text-slate-400 opacity-90",
    };

    const statusIcons = {
        completed: <CheckCircle className="w-5 h-5 text-white" />,
        pending: <CircleDashed className="w-5 h-5 text-black animate-spin-slow" />,
        locked: <Lock className="w-4 h-4 text-slate-500" />,
    };

    return (
        <div className={clsx(
            "px-4 py-3 rounded-md border-2 min-w-[200px] max-w-[250px] transition-all duration-300 font-sans relative flex flex-col gap-2",
            statusStyles[data.status] || statusStyles.locked
        )}>
            {/* Top Handle for Top-Bottom Layout */}
            <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-3 !h-3 !-top-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between gap-3">
                <span className="font-bold text-sm leading-tight uppercase tracking-wide">{data.label}</span>
                <div className="shrink-0 pt-0.5">
                    {statusIcons[data.status]}
                </div>
            </div>

            {data.description && (
                <div className={clsx(
                    "text-xs leading-relaxed border-t pt-2 mt-1",
                    data.status === 'pending' ? "border-black/10 text-black/80" :
                        data.status === 'completed' ? "border-white/20 text-white/90" :
                            "border-white/5 text-slate-500"
                )}>
                    {data.status === 'locked' ? 'Complete previous steps to unlock' : data.description.slice(0, 60) + (data.description.length > 60 ? '...' : '')}
                </div>
            )}

            {/* Bottom Handle for Top-Bottom Layout */}
            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-3 !h-3 !-bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

const nodeTypes = {
    topic: CustomNode,
};

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Adjusted settings for Top-Bottom layout typical of roadmaps
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 80, // Horizontal separation between nodes
        ranksep: 100 // Vertical separation between ranks (levels)
    });

    nodes.forEach((node) => {
        // Approximate width/height including padding for layout calculation
        dagreGraph.setNode(node.id, { width: 220, height: 120 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return {
        nodes: nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            return {
                ...node,
                targetPosition: Position.Top,
                sourcePosition: Position.Bottom,
                position: {
                    x: nodeWithPosition.x - 110, // Center offset (width/2)
                    y: nodeWithPosition.y - 60,  // Center offset (height/2)
                },
            };
        }),
        edges,
    };
};

import VerifiedModal from "../components/VerifiedModal";

const Roadmap = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [roadmapData, setRoadmapData] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [verifyingNode, setVerifyingNode] = useState(null);

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                const res = await api.get("/roadmap/all");
                if (res.data.status === 200) {
                    const found = res.data.roadmaps.find(r => r._id === id);
                    if (found) {
                        setRoadmapData(found);
                        processGraph(found.nodes, found.edges);
                    } else {
                        console.error("Roadmap not found");
                    }
                }
            } catch (error) {
                console.error("Error loading roadmap", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoadmap();
    }, [id]);

    const processGraph = (initialNodes, initialEdges) => {
        if (!initialNodes || !Array.isArray(initialNodes) || initialNodes.length === 0) {
            console.error("processGraph: Invalid nodes received", initialNodes);
            return;
        }

        try {
            const flowNodes = initialNodes.map(node => ({
                id: node.id,
                type: 'topic',
                data: {
                    label: node.data?.label || "Node",
                    description: node.data?.description || "",
                    status: node.status || "locked",
                    resources: node.data?.resources || []
                },
                position: { x: 0, y: 0 }
            }));

            const flowEdges = initialEdges ? initialEdges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                animated: true,
                style: { stroke: '#64748b', strokeWidth: 2 },
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            })) : [];

            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                flowNodes,
                flowEdges,
                'TB'
            );

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
        } catch (error) {
            console.error("processGraph logic failed:", error);
            // Don't clear existing nodes on error to prevent disappearance
        }
    };

    const handleNodeClick = (event, node) => {
        if (node.data.status === 'locked') return;
        setSelectedNode(node);
    };

    const handleVerificationSuccess = (updatedRoadmap) => {
        console.log("Verification successful, refreshing graph");
        processGraph(updatedRoadmap.nodes, updatedRoadmap.edges);

        // Update selected node modal if open
        if (selectedNode) {
            // Find the updated status for the selected node
            const updatedNode = updatedRoadmap.nodes.find(n => n.id === selectedNode.id);
            if (updatedNode) {
                setSelectedNode(prev => ({
                    ...prev,
                    data: { ...prev.data, status: updatedNode.status }
                }));
            }
        }
    };

    const handleStatusUpdate = async (nodeId, newStatus) => {
        // Intercept "completed" status update to show verification modal
        if (newStatus === "completed") {
            setVerifyingNode({ id: nodeId });
            // Close detail modal if it's the same node, or keep it open? 
            // Better to keep it open or let the modal stack. 
            // For now, let's keep detail modal open, and show verification on top.
            return;
        }

        try {
            console.log("Updating status:", nodeId, newStatus);
            // Optimistic update to provide immediate feedback
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: { ...node.data, status: newStatus },
                        };
                    }
                    return node;
                })
            );

            const res = await api.put("/roadmap/update", {
                roadmapId: id,
                nodeId: nodeId,
                status: newStatus
            });

            if (res.data.status === 200) {
                console.log("Update successful, refreshing graph");
                const updatedRoadmap = res.data.roadmap;
                // Re-process graph to handle unlocking of next nodes and layout updates
                processGraph(updatedRoadmap.nodes, updatedRoadmap.edges);

                // Update selected node modal if open
                if (selectedNode && selectedNode.id === nodeId) {
                    setSelectedNode(prev => ({
                        ...prev,
                        data: { ...prev.data, status: newStatus }
                    }));
                }
            } else {
                console.error("Update failed:", res.data);
                // Revert optimistic update if needed or just re-fetch
                // fetchRoadmap(); // Fallback
            }
        } catch (error) {
            console.error("Failed to update node", error);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-white bg-[#0f0f0f]"><Loader2 className="animate-spin mr-2" /> Loading Roadmap...</div>;
    }

    if (!roadmapData) {
        return <div className="flex h-screen items-center justify-center text-white bg-[#0f0f0f]">Roadmap not found.</div>;
    }

    return (
        <div className="h-full min-h-screen w-full relative bg-[#0f0f0f] flex flex-col">
            <VerifiedModal
                isOpen={!!verifyingNode}
                onClose={() => setVerifyingNode(null)}
                roadmapId={id}
                nodeId={verifyingNode?.id}
                onSuccess={handleVerificationSuccess}
            />

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")} className="bg-black/40 hover:bg-black/60 border border-white/10 text-white backdrop-blur-md">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </div>
                <div className="text-right pointer-events-auto">
                    <h1 className="font-serif text-4xl text-white font-bold tracking-tight">{roadmapData.domain}</h1>
                    <p className="text-sm text-gray-400 mt-2 font-medium">Interactive Learning Path</p>
                </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 w-full relative min-h-[500px]">
                <div className="absolute inset-0">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        onNodeClick={handleNodeClick}
                        nodesDraggable={false}
                        fitView
                        className="bg-[#0f0f0f]"
                        minZoom={0.1}
                        maxZoom={1.5}
                    >
                        <Background color="#333" gap={30} size={1} variant="dots" className="opacity-20" />
                        <Controls className="bg-black/50 border border-white/10 text-white fill-white stroke-white" />
                        <MiniMap
                            className="bg-black/80 border border-white/10 rounded-lg overflow-hidden"
                            nodeColor={(n) => {
                                if (n.data.status === 'completed') return '#10b981';
                                if (n.data.status === 'pending') return '#fbbf24';
                                return '#334155';
                            }}
                            maskColor="rgba(0,0,0, 0.6)"
                        />
                    </ReactFlow>
                </div>
            </div>

            <DetailModal
                isOpen={!!selectedNode}
                onClose={() => setSelectedNode(null)}
                node={selectedNode}
                onStatusChange={handleStatusUpdate}
            />
        </div>
    );
};

export default Roadmap;
