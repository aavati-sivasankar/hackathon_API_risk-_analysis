import { loadYamlDataset } from "../parser/datasetLoader";
import { buildGraph } from "../graph/graphBuilder";
import { layoutGraph } from "../graph/graphLayout";

import {
  analyzeChangeImpact,
} from "./changeImpactAnalyzer";

import {
  getChangeImpactPaths,
} from "./changeImpactPaths";

import {
  generateTestScope,
} from "./testScopeAnalyzer";

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

const impactResult =
  analyzeChangeImpact(
    graph.nodes,
    graph.edges,
    inventoryNode.id
  );

const impactPaths =
  getChangeImpactPaths(
    graph.nodes,
    graph.edges,
    inventoryNode.id
  );

const testScope =
  generateTestScope(
    impactResult,
    impactPaths
  );

console.log(
  "========== TEST SCOPE ANALYSIS =========="
);

console.log(
  "Modified:",
  impactResult.modified.name
);

console.log(
  "Total Recommendations:",
  testScope.length
);

console.log(
  "------------------------------------------"
);

for (const item of testScope) {
  console.log(
    "Category:",
    item.category
  );

  if (item.component) {
    console.log(
      "Component:",
      item.component.name
    );

    console.log(
      "Type:",
      item.component.type
    );
  }

  console.log(
    "Recommendation:",
    item.recommendation
  );

  console.log(
    "------------------------------------------"
  );
}