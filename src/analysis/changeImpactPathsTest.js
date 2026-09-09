import { loadYamlDataset } from "../parser/datasetLoader";
import { buildGraph } from "../graph/graphBuilder";
import { layoutGraph } from "../graph/graphLayout";

import {
  getChangeImpactPaths,
} from "./changeImpactPaths";

const yamlFiles = import.meta.glob(
  "../data/yaml/**/*.yaml",
  {
    query: "?raw",
    import: "default",
    eager: true,
  }
);

const dataset =
  loadYamlDataset(yamlFiles);

const graph = layoutGraph(
  buildGraph(dataset.components)
);

const inventoryNode =
  graph.nodes.find(
    (node) =>
      node.data.name ===
      "Inventory Service"
  );

const results =
  getChangeImpactPaths(
    graph.nodes,
    graph.edges,
    inventoryNode.id
  );

console.log(
  "========== CHANGE IMPACT PATH TEST =========="
);

console.log(
  "Total paths:",
  results.length
);

console.log(
  "----------------------------------------------"
);

for (const result of results) {
  console.log(
    `${result.target.name}`
  );

  console.log(
    `Impact: ${result.impact}`
  );

  console.log(
    `Distance: ${result.distance}`
  );

  console.log(
    "Path:",
    result.path
      .map((node) => node.name)
      .join(" → ")
  );

  console.log(
    "----------------------------------------------"
  );
}