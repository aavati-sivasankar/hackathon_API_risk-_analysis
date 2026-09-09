/**
 * Analyze the architecture graph and generate
 * structural metrics and criticality suggestions.
 *
 * IMPORTANT:
 * These metrics are based only on dependency relationships.
 * They do NOT represent actual business criticality.
 */

export function analyzeGraphMetrics(nodes, edges) {
  if (!nodes || nodes.length === 0) {
    return {
      totalComponents: 0,
      totalServices: 0,
      totalApplications: 0,
      totalDatabases: 0,
      totalExternalSystems: 0,
      totalDependencies: 0,
      averageDependencies: 0,
      mostConnected: null,
      criticalCandidate: null,
      largeBlastRadiusCandidate: null,
      componentMetrics: [],
    };
  }

  const nodeMap = new Map(
    nodes.map((node) => [node.id, node])
  );

  /*
   * Build downstream adjacency.
   *
   * Graph direction:
   *
   * dependency → dependent
   *
   * Example:
   *
   * Product DB → Product Catalog → Pricing → Order
   */
  const downstreamMap = new Map();

  for (const node of nodes) {
    downstreamMap.set(node.id, []);
  }

  for (const edge of edges || []) {
    if (!downstreamMap.has(edge.source)) {
      downstreamMap.set(edge.source, []);
    }

    downstreamMap
      .get(edge.source)
      .push(edge.target);
  }

  /*
   * Calculate all downstream components.
   */
  function getDownstreamCount(nodeId) {
    const visited = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift();

      for (const target of downstreamMap.get(current) || []) {
        if (visited.has(target)) {
          continue;
        }

        visited.add(target);
        queue.push(target);
      }
    }

    return visited.size;
  }

  /*
   * Direct dependency count.
   */
  function getDependencyCount(node) {
    return node.data?.dependencies?.length || 0;
  }

  /*
   * Direct consumer count.
   */
  function getConsumerCount(node) {
    return node.data?.consumers?.length || 0;
  }

  /*
   * Calculate raw metrics for every component.
   */
  const rawMetrics = nodes.map((node) => {
    const dependencies =
      getDependencyCount(node);

    const consumers =
      getConsumerCount(node);

    const downstreamCount =
      getDownstreamCount(node.id);

    const totalConnections =
      dependencies + consumers;

    return {
      id: node.id,
      name: node.data?.name || node.id,
      type: node.data?.type || "UNKNOWN",

      dependencies,
      consumers,

      totalConnections,

      downstreamCount,
    };
  });

  /*
   * Find maximum values.
   */
  const maxConsumers = Math.max(
    ...rawMetrics.map(
      (item) => item.consumers
    ),
    1
  );

  const maxDependencies = Math.max(
    ...rawMetrics.map(
      (item) => item.dependencies
    ),
    1
  );

  const maxConnections = Math.max(
    ...rawMetrics.map(
      (item) => item.totalConnections
    ),
    1
  );

  const maxDownstream = Math.max(
    ...rawMetrics.map(
      (item) => item.downstreamCount
    ),
    1
  );

  /*
   * Calculate suggested criticality score.
   *
   * 30% → consumers
   * 30% → downstream blast radius
   * 20% → dependencies
   * 20% → total connections
   */
  const componentMetrics =
    rawMetrics.map((item) => {
      const consumerScore =
        (item.consumers /
          maxConsumers) *
        30;

      const downstreamScore =
        (item.downstreamCount /
          maxDownstream) *
        30;

      const dependencyScore =
        (item.dependencies /
          maxDependencies) *
        20;

      const connectionScore =
        (item.totalConnections /
          maxConnections) *
        20;

      const criticalityScore = Math.round(
        consumerScore +
          downstreamScore +
          dependencyScore +
          connectionScore
      );

      return {
        ...item,
        criticalityScore,
      };
    });

  /*
   * Highest overall connectivity.
   */
  const mostConnected =
    [...componentMetrics].sort(
      (a, b) =>
        b.totalConnections -
        a.totalConnections
    )[0] || null;

  /*
   * Highest suggested criticality.
   */
  const criticalCandidate =
    [...componentMetrics].sort(
      (a, b) => {
        if (
          b.criticalityScore !==
          a.criticalityScore
        ) {
          return (
            b.criticalityScore -
            a.criticalityScore
          );
        }

        return (
          b.downstreamCount -
          a.downstreamCount
        );
      }
    )[0] || null;

  /*
   * Highest downstream reach.
   */
  const largeBlastRadiusCandidate =
    [...componentMetrics].sort(
      (a, b) => {
        if (
          b.downstreamCount !==
          a.downstreamCount
        ) {
          return (
            b.downstreamCount -
            a.downstreamCount
          );
        }

        return (
          b.criticalityScore -
          a.criticalityScore
        );
      }
    )[0] || null;

  /*
   * Architecture composition.
   */
  const totalServices =
    nodes.filter(
      (node) =>
        node.data?.type === "API"
    ).length;

  const totalApplications =
    nodes.filter(
      (node) =>
        node.data?.type === "APPLICATION"
    ).length;

  const totalDatabases =
    nodes.filter(
      (node) =>
        node.data?.type === "DATABASE"
    ).length;

  const totalExternalSystems =
    nodes.filter(
      (node) =>
        node.data?.type === "EXTERNAL"
    ).length;

  const averageDependencies =
    nodes.length > 0
      ? (
          edges.length /
          nodes.length
        ).toFixed(2)
      : "0.00";

  return {
    totalComponents: nodes.length,

    totalServices,

    totalApplications,

    totalDatabases,

    totalExternalSystems,

    totalDependencies: edges.length,

    averageDependencies,

    mostConnected,

    criticalCandidate,

    largeBlastRadiusCandidate,

    componentMetrics,
  };
}