import { loadYamlDataset } from "../parser/datasetLoader";
import { buildGraph } from "./graphBuilder";

// --------------------------------------------------
// Load all YAML files
// --------------------------------------------------

const yamlFiles = import.meta.glob(
  "../data/yaml/**/*.yaml",
  {
    query: "?raw",
    import: "default",
    eager: true,
  }
);

console.log("====================================");
console.log("       GRAPH BUILDER TEST");
console.log("====================================");

try {
  // Module 1
  const dataset = loadYamlDataset(yamlFiles);

  console.log(
    "Components from Module 1:",
    dataset.components.length
  );

  // Module 2
  const graph = buildGraph(dataset.components);

  console.log("------------------------------------");

  console.log(
    "Graph nodes:",
    graph.nodes.length
  );

  console.log(
    "Graph edges:",
    graph.edges.length
  );

  console.log("------------------------------------");

  console.log("Nodes:");
  console.log(graph.nodes);

  console.log("------------------------------------");

  console.log("Edges:");
  console.log(graph.edges);

  console.log("------------------------------------");

  // --------------------------------------------------
  // Basic validation
  // --------------------------------------------------

  const nodeIds = new Set(
    graph.nodes.map((node) => node.id)
  );

  const invalidEdges = graph.edges.filter(
    (edge) =>
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target)
  );

  const duplicateEdgeIds = graph.edges.filter(
    (edge, index, array) =>
      array.findIndex(
        (item) => item.id === edge.id
      ) !== index
  );

  console.log(
    "Invalid edges:",
    invalidEdges
  );

  console.log(
    "Duplicate edges:",
    duplicateEdgeIds
  );

  console.log("====================================");

  if (
    graph.nodes.length === dataset.components.length &&
    invalidEdges.length === 0 &&
    duplicateEdgeIds.length === 0
  ) {
    console.log(
      "✅ MODULE 2 GRAPH BUILDER TEST PASSED"
    );
  } else {
    console.warn(
      "⚠️ GRAPH BUILDER TEST FAILED"
    );
  }

  console.log("====================================");
} catch (error) {
  console.error(
    "❌ MODULE 2 GRAPH BUILDER TEST FAILED"
  );

  console.error(error);
}