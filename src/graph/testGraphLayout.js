import { loadYamlDataset } from "../parser/datasetLoader";
import { buildGraph } from "./graphBuilder";
import { layoutGraph } from "./graphLayout";

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

console.log("===== GRAPH LAYOUT TEST =====");

console.log("Nodes:", layoutedGraph.nodes.length);
console.log("Edges:", layoutedGraph.edges.length);

console.log(
  "First 5 node positions:",
  layoutedGraph.nodes.slice(0, 5).map((node) => ({
    name: node.data.name,
    x: node.position.x,
    y: node.position.y,
  }))
);

const overlappingNodes =
  layoutedGraph.nodes.filter(
    (node) =>
      node.position.x === 0 &&
      node.position.y === 0
  );

console.log(
  "Nodes still at (0,0):",
  overlappingNodes.length
);