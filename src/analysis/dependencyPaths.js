/**
 * Dependency Path Analyzer
 *
 * Graph direction:
 *
 * dependency → dependent / consumer
 *
 * Example:
 *
 * Inventory Service
 *        ↓
 * Order Service
 *        ↓
 * Invoice Service
 */

/**
 * Find a node by ID.
 */
function getNode(nodes, nodeId) {
  return nodes.find((node) => node.id === nodeId);
}

/**
 * Get downstream neighbors of a node.
 */
function getDownstreamIds(edges, nodeId) {
  return edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => edge.target);
}

/**
 * Find a path from one component to another.
 *
 * Uses BFS so the shortest dependency path is returned.
 *
 * Returns:
 *
 * [
 *   "inventory-service",
 *   "order-service",
 *   "invoice-service"
 * ]
 *
 * Returns null if no path exists.
 */
export function findDependencyPath(
  edges,
  startId,
  targetId
) {
  if (startId === targetId) {
    return [startId];
  }

  const queue = [[startId]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];

    const downstreamIds = getDownstreamIds(
      edges,
      currentId
    );

    for (const nextId of downstreamIds) {
      if (visited.has(nextId)) {
        continue;
      }

      const newPath = [...path, nextId];

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
 * Convert node IDs into readable component information.
 */
export function resolvePath(nodes, path) {
  if (!path) {
    return [];
  }

  return path
    .map((nodeId) => getNode(nodes, nodeId))
    .filter(Boolean)
    .map((node) => ({
      id: node.id,
      name: node.data.name,
      type: node.data.type,
    }));
}

/**
 * Find all downstream paths from a selected component.
 *
 * Each affected component receives its shortest path
 * from the selected component.
 */
export function getDownstreamPaths(
  nodes,
  edges,
  startId
) {
  const paths = [];

  for (const node of nodes) {
    if (node.id === startId) {
      continue;
    }

    const path = findDependencyPath(
      edges,
      startId,
      node.id
    );

    if (!path || path.length < 2) {
      continue;
    }

    paths.push({
      target: {
        id: node.id,
        name: node.data.name,
        type: node.data.type,
      },
      distance: path.length - 1,
      path: resolvePath(nodes, path),
    });
  }

  return paths.sort(
    (a, b) => a.distance - b.distance
  );
}