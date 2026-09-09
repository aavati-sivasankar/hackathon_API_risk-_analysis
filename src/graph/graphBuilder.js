function createId(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Convert the normalized component dataset
 * into a graph structure.
 *
 * Output:
 * {
 *   nodes: [],
 *   edges: []
 * }
 */
export function buildGraph(components) {
  const nodes = [];
  const edges = [];

  // --------------------------------------------------
  // STEP 1: Create a lookup table
  // --------------------------------------------------

  const componentMap = new Map();

  for (const component of components) {
    componentMap.set(component.name, component);
  }

  // --------------------------------------------------
  // STEP 2: Create graph nodes
  // --------------------------------------------------

  for (const component of components) {
    nodes.push({
      id: component.id,
      type: "component",

      position: {
        x: 0,
        y: 0,
      },

      data: {
        name: component.name,
        type: component.type,

        dependencies: component.dependencies,
        consumers: component.consumers,

        sourceFile: component.sourceFile,
      },
    });
  }

  // --------------------------------------------------
  // STEP 3: Create edges from dependencies
  //
  // If:
  //
  // Order Service
  // dependencies:
  //   - Inventory Service
  //
  // Graph:
  //
  // Inventory Service → Order Service
  // --------------------------------------------------

  const edgeKeys = new Set();

  for (const component of components) {
    for (const dependency of component.dependencies) {
      const dependencyComponent = componentMap.get(dependency);

      if (!dependencyComponent) {
        continue;
      }

      const source = dependencyComponent.id;
      const target = component.id;

      const edgeKey = `${source}->${target}`;

      if (!edgeKeys.has(edgeKey)) {
        edges.push({
          id: `${source}-${target}`,

          source,
          target,

          type: "smoothstep",

          data: {
            relationship: "dependency",
          },
        });

        edgeKeys.add(edgeKey);
      }
    }
  }

  // --------------------------------------------------
  // STEP 4: Create edges from consumers
  //
  // If:
  //
  // Inventory Service
  // consumers:
  //   - Order Service
  //
  // Graph:
  //
  // Inventory Service → Order Service
  //
  // Duplicate edges are automatically ignored.
  // --------------------------------------------------

  for (const component of components) {
    for (const consumer of component.consumers) {
      const consumerComponent = componentMap.get(consumer);

      if (!consumerComponent) {
        continue;
      }

      const source = component.id;
      const target = consumerComponent.id;

      const edgeKey = `${source}->${target}`;

      if (!edgeKeys.has(edgeKey)) {
        edges.push({
          id: `${source}-${target}`,

          source,
          target,

          type: "smoothstep",

          data: {
            relationship: "consumer",
          },
        });

        edgeKeys.add(edgeKey);
      }
    }
  }

  // --------------------------------------------------
  // STEP 5: Return complete graph
  // --------------------------------------------------

  return {
    nodes,
    edges,
  };
}