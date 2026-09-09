import { loadYamlDataset } from "../parser/datasetLoader";
import { buildGraph } from "../graph/graphBuilder";
import { layoutGraph } from "../graph/graphLayout";

import {
  findDependencyPath,
  getDownstreamPaths,
} from "./dependencyPaths";

const yamlFiles = import.meta.glob(
  "../data/yaml/**/*.yaml",
  {
    query: "?raw",
    import: "default",
    eager: true,
  }
);

const dataset = loadYamlDataset(yamlFiles);

const graph = buildGraph(dataset.components);

const layoutedGraph = layoutGraph(graph);

console.log(
  "===== DEPENDENCY PATH TEST ====="
);

// --------------------------------------------------
// Test 1: Inventory → Invoice
// --------------------------------------------------

const inventoryToInvoice = findDependencyPath(
  layoutedGraph.edges,
  "inventory-service",
  "invoice-service"
);

console.log(
  "Inventory → Invoice path:",
  inventoryToInvoice
);

// --------------------------------------------------
// Test 2: Resolve path into component names
// --------------------------------------------------

const inventoryPaths = getDownstreamPaths(
  layoutedGraph.nodes,
  layoutedGraph.edges,
  "inventory-service"
);

console.log(
  "Inventory downstream paths:"
);

for (const item of inventoryPaths) {
  console.log(
    `${item.target.name} (${item.distance} hops):`,
    item.path.map((node) => node.name).join(" → ")
  );
}