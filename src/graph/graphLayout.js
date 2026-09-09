import dagre from "@dagrejs/dagre";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;

/**
 * Apply automatic hierarchical layout to the graph.
 *
 * Layout direction:
 * LR = Left → Right
 *
 * Example:
 *
 * Product DB
 *     ↓
 * Inventory Service
 *     ↓
 * Order Service
 *     ↓
 * Invoice Service
 *
 * @param {Object} graph
 * @param {Array} graph.nodes
 * @param {Array} graph.edges
 * @returns {Object} graph with calculated node positions
 */
export function layoutGraph({ nodes, edges }) {
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: "LR",
    nodesep: 60,
    ranksep: 120,
    marginx: 40,
    marginy: 40,
  });

  // Register nodes with Dagre
  for (const node of nodes) {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  }

  // Register edges
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  // Calculate layout
  dagre.layout(graph);

  // Convert Dagre positions to React Flow positions
  const layoutedNodes = nodes.map((node) => {
    const position = graph.node(node.id);

    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
      sourcePosition: "right",
      targetPosition: "left",
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}