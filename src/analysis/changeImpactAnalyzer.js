function getNode(nodes, nodeId) {
  return nodes.find((node) => node.id === nodeId);
}

function getDirectDownstream(edges, nodeId) {
  return edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => edge.target);
}

/**
 * Analyze the potential impact of modifying
 * a component.
 *
 * Impact direction:
 *
 * Modified Component
 *        ↓
 * Direct Consumers
 *        ↓
 * Indirect Consumers
 *
 * This is based purely on dependency relationships.
 */
export function analyzeChangeImpact(
  nodes,
  edges,
  modifiedNodeId
) {
  const modifiedNode = getNode(
    nodes,
    modifiedNodeId
  );

  if (!modifiedNode) {
    throw new Error(
      `Component with ID "${modifiedNodeId}" was not found`
    );
  }

  const directImpact = [];
  const indirectImpact = [];

  const visited = new Set([modifiedNodeId]);

  /*
   * -----------------------------------------
   * 1. Find direct impact
   * -----------------------------------------
   */

  const directIds = getDirectDownstream(
    edges,
    modifiedNodeId
  );

  for (const nodeId of directIds) {
    if (visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);

    const node = getNode(nodes, nodeId);

    if (!node) {
      continue;
    }

    directImpact.push({
      id: node.id,
      name: node.data.name,
      type: node.data.type,
      reason: `Direct dependent of ${modifiedNode.data.name}`,
    });
  }

  /*
   * -----------------------------------------
   * 2. Find indirect impact
   * -----------------------------------------
   *
   * Start from direct dependents and continue
   * tracing downstream until no new components
   * are found.
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
        reason: `Potentially affected through ${currentId}`,
      });

      queue.push(nodeId);
    }
  }

  return {
    modified: {
      id: modifiedNode.id,
      name: modifiedNode.data.name,
      type: modifiedNode.data.type,
    },

    directImpact,

    indirectImpact,

    totalAffected:
      directImpact.length +
      indirectImpact.length,
  };
}