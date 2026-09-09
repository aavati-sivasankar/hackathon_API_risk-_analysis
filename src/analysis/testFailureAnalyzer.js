import { loadYamlDataset } from "../parser/datasetLoader";
import { buildGraph } from "../graph/graphBuilder";
import { layoutGraph } from "../graph/graphLayout";

import {
  analyzeFailure,
} from "./failureAnalyzer";

const yamlFiles = import.meta.glob(
  "../data/yaml/**/*.yaml",
  {
    query: "?raw",
    import: "default",
    eager: true,
  }
);

const dataset = loadYamlDataset(
  yamlFiles
);

const graph = buildGraph(
  dataset.components
);

const layoutedGraph = layoutGraph(
  graph
);

const result = analyzeFailure(
  layoutedGraph.nodes,
  layoutedGraph.edges,
  "inventory-service"
);

console.log(
  "===== FAILURE ANALYZER TEST ====="
);

console.log(
  "Failed component:",
  result.failed.name
);

console.log(
  "Direct impact:",
  result.directImpact.map(
    (node) => node.name
  )
);

console.log(
  "Indirect impact:",
  result.indirectImpact.map(
    (node) => node.name
  )
);

console.log(
  "Total affected:",
  result.totalAffected
);