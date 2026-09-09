/**
 * Dependency Analysis Engine
 *
 * Works on the graph produced by graphBuilder.js.
 *
 * Graph direction:
 *
 * dependency → dependent/consumer
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
 */

/**
 * Find a node by ID.
 */
function getNode(nodes, nodeId) {
  return nodes.find((node) => node.id === nodeId);
}

/**
 * Find direct dependencies of a component.
 *
 * These are nodes that point INTO the selected node.
 */
export function getDirectUpstream(nodes, edges, nodeId) {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => getNode(nodes, edge.source))
    .filter(Boolean);
}

/**
 * Find direct consumers of a component.
 *
 * These are nodes that the selected node points TO.
 */
export function getDirectDownstream(nodes, edges, nodeId) {
  return edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => getNode(nodes, edge.target))
    .filter(Boolean);
}

/**
 * Find all upstream dependencies using BFS.
 *
 * The selected component itself is NOT included.
 */
export function getAllUpstream(nodes, edges, nodeId) {
  const visited = new Set();
  const queue = [nodeId];

  const result = [];

  while (queue.length > 0) {
    const currentId = queue.shift();

    const upstream = getDirectUpstream(
      nodes,
      edges,
      currentId
    );

    for (const node of upstream) {
      if (visited.has(node.id)) {
        continue;
      }

      visited.add(node.id);
      result.push(node);

      queue.push(node.id);
    }
  }

  return result;
}

/**
 * Find all downstream consumers using BFS.
 *
 * The selected component itself is NOT included.
 */
export function getAllDownstream(nodes, edges, nodeId) {
  const visited = new Set();
  const queue = [nodeId];

  const result = [];

  while (queue.length > 0) {
    const currentId = queue.shift();

    const downstream = getDirectDownstream(
      nodes,
      edges,
      currentId
    );

    for (const node of downstream) {
      if (visited.has(node.id)) {
        continue;
      }

      visited.add(node.id);
      result.push(node);

      queue.push(node.id);
    }
  }

  return result;
}

/**
 * Analyze a component's complete dependency neighborhood.
 */
export function analyzeDependencies(
  nodes,
  edges,
  nodeId
) {
  const selectedNode = getNode(nodes, nodeId);

  if (!selectedNode) {
    throw new Error(
      `Component with ID "${nodeId}" was not found`
    );
  }

  const directUpstream = getDirectUpstream(
    nodes,
    edges,
    nodeId
  );

  const directDownstream = getDirectDownstream(
    nodes,
    edges,
    nodeId
  );

  const allUpstream = getAllUpstream(
    nodes,
    edges,
    nodeId
  );

  const allDownstream = getAllDownstream(
    nodes,
    edges,
    nodeId
  );

  const directUpstreamIds = new Set(
    directUpstream.map((node) => node.id)
  );

  const directDownstreamIds = new Set(
    directDownstream.map((node) => node.id)
  );

  const indirectUpstream = allUpstream.filter(
    (node) => !directUpstreamIds.has(node.id)
  );

  const indirectDownstream = allDownstream.filter(
    (node) => !directDownstreamIds.has(node.id)
  );

  return {
    selected: selectedNode,

    upstream: {
      direct: directUpstream,
      indirect: indirectUpstream,
      all: allUpstream,
    },

    downstream: {
      direct: directDownstream,
      indirect: indirectDownstream,
      all: allDownstream,
    },
  };
}