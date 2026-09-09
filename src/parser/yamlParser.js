import { load } from "js-yaml";

export function parseYamlFile(fileContent, fileName = "unknown.yaml") {
  try {
    const parsed = load(fileContent);

    if (!parsed || typeof parsed !== "object") {
      throw new Error(`Invalid YAML structure in ${fileName}`);
    }

    return {
      ...parsed,
      _sourceFile: fileName,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse ${fileName}: ${error.message}`
    );
  }
}