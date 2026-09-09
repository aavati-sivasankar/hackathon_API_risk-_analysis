import { parseYamlFile } from "./yamlParser";
import {
  normalizeComponent,
  validateReferences,
} from "./normalizer";

export function loadYamlDataset(yamlFiles) {
  const components = [];

  for (const [filePath, fileContent] of Object.entries(yamlFiles)) {
    const fileName = filePath.split("/").pop();

    const parsed = parseYamlFile(
      fileContent,
      fileName
    );

    const normalized = normalizeComponent(parsed);

    components.push(normalized);
  }

  const missingReferences =
    validateReferences(components);

  return {
    components,
    missingReferences,
  };
}