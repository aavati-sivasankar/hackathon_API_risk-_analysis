function getNode(nodes, nodeId) {
  return nodes.find((node) => node.id === nodeId);
}

function getDownstreamIds(edges, nodeId) {
  return edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => edge.target);
}

/**
 * Find the shortest downstream dependency path
 * between two components.
 *
 * Example:
 *
 * Inventory
 *    ↓
 * Order
 *    ↓
 * Invoice
 *
 * returns:
 *
 * [
 *   inventoryId,
 *   orderId,
 *   invoiceId
 * ]
 */
export function findImpactPath(
  edges,
  startId,
  targetId
) {
  if (startId === targetId) {
    return [startId];
  }

  const queue = [[startId]];

  const visited = new Set([
    startId,
  ]);

  while (queue.length > 0) {
    const currentPath = queue.shift();

    const currentId =
      currentPath[currentPath.length - 1];

    const downstreamIds =
      getDownstreamIds(
        edges,
        currentId
      );

    for (const nextId of downstreamIds) {
      if (visited.has(nextId)) {
        continue;
      }

      const newPath = [
        ...currentPath,
        nextId,
      ];

      if (nextId === targetId) {
        return newPath;
      }

      visited.add(nextId);

      queue.push(newPath);
    }
  }

  return null;
}

/**
 * Convert component IDs in a path
 * into useful component information.
 */
export function resolveImpactPath(
  nodes,
  path
) {
  if (!path) {
    return [];
  }

  return path
    .map((nodeId) =>
      getNode(nodes, nodeId)
    )
    .filter(Boolean)
    .map((node) => ({
      id: node.id,
      name: node.data.name,
      type: node.data.type,
    }));
}

/**
 * Get the impact path for every affected component.
 *
 * The result distinguishes between:
 *
 * Direct impact:
 * distance = 1
 *
 * Indirect impact:
 * distance > 1
 */
export function getChangeImpactPaths(
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

  const results = [];

  for (const node of nodes) {
    if (node.id === modifiedNodeId) {
      continue;
    }

    const path = findImpactPath(
      edges,
      modifiedNodeId,
      node.id
    );

    if (!path || path.length < 2) {
      continue;
    }

    const resolvedPath =
      resolveImpactPath(
        nodes,
        path
      );

    const distance =
      path.length - 1;

    results.push({
      target: {
        id: node.id,
        name: node.data.name,
        type: node.data.type,
      },

      distance,

      impact:
        distance === 1
          ? "direct"
          : "indirect",

      path: resolvedPath,
    });
  }

  return results.sort(
    (a, b) =>
      a.distance - b.distance
  );
}