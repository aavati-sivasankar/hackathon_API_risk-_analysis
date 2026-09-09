/**
 * Failure Analysis Engine
 *
 * Determines which components are affected when
 * a selected component becomes unavailable.
 *
 * Graph direction:
 *
 * dependency → dependent / consumer
 *
 * Failure propagates DOWNSTREAM only.
 */

/**
 * Find a graph node by ID.
 */
function getNode(nodes, nodeId) {
  return nodes.find((node) => node.id === nodeId);
}

/**
 * Get direct downstream consumers.
 */
function getDirectDownstream(edges, nodeId) {
  return edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => edge.target);
}

/**
 * Analyze the impact of a component failure.
 *
 * @param {Array} nodes React Flow nodes
 * @param {Array} edges React Flow edges
 * @param {String} failedNodeId Component that has failed
 *
 * @returns {Object}
 */
export function analyzeFailure(
  nodes,
  edges,
  failedNodeId
) {
  const failedNode = getNode(
    nodes,
    failedNodeId
  );

  if (!failedNode) {
    throw new Error(
      `Component with ID "${failedNodeId}" was not found`
    );
  }

  const directImpact = [];
  const indirectImpact = [];

  const visited = new Set([
    failedNodeId,
  ]);

  /**
   * First level:
   * Direct consumers.
   */
  const directIds = getDirectDownstream(
    edges,
    failedNodeId
  );

  for (const nodeId of directIds) {
    if (visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);

    const node = getNode(nodes, nodeId);

    if (node) {
      directImpact.push({
        id: node.id,
        name: node.data.name,
        type: node.data.type,
        reason: `Direct consumer of ${failedNode.data.name}`,
      });
    }
  }

  /**
   * Remaining levels:
   * Indirect consumers.
   */
  const queue = [...directIds];

  while (queue.length > 0) {
    const currentId = queue.shift();

    const downstreamIds =
      getDirectDownstream(
        edges,
        currentId
      );

    for (const nodeId of downstreamIds) {
      if (visited.has(nodeId)) {
        continue;
      }

      visited.add(nodeId);

      const node = getNode(
        nodes,
        nodeId
      );

      if (!node) {
        continue;
      }

      indirectImpact.push({
        id: node.id,
        name: node.data.name,
        type: node.data.type,
        reason: `Affected through ${currentId}`,
      });

      queue.push(nodeId);
    }
  }

  return {
    failed: {
      id: failedNode.id,
      name: failedNode.data.name,
      type: failedNode.data.type,
    },

    directImpact,

    indirectImpact,

    totalAffected:
      directImpact.length +
      indirectImpact.length,
  };
}