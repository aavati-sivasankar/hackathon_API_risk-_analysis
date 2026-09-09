import { loadYamlDataset } from "../parser/datasetLoader";
import { buildGraph } from "../graph/graphBuilder";
import { layoutGraph } from "../graph/graphLayout";

import {
  analyzeDependencies,
} from "./dependencyAnalyzer";

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

const inventoryId = "inventory-service";

const result = analyzeDependencies(
  layoutedGraph.nodes,
  layoutedGraph.edges,
  inventoryId
);

console.log(
  "===== DEPENDENCY ANALYZER TEST ====="
);

console.log(
  "Selected:",
  result.selected.data.name
);

console.log(
  "Direct upstream:",
  result.upstream.direct.map(
    (node) => node.data.name
  )
);

console.log(
  "Indirect upstream:",
  result.upstream.indirect.map(
    (node) => node.data.name
  )
);

console.log(
  "Direct downstream:",
  result.downstream.direct.map(
    (node) => node.data.name
  )
);

console.log(
  "Indirect downstream:",
  result.downstream.indirect.map(
    (node) => node.data.name
  )
);