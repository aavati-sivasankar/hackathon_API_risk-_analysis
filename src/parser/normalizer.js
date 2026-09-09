function createId(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return [String(value).trim()];
}

export function normalizeComponent(raw) {
  if (!raw.service) {
    throw new Error(
      `YAML file ${raw._sourceFile || "unknown"} is missing "service"`
    );
  }

  const name = String(raw.service).trim();

  return {
    id: createId(name),

    name,

    type: String(raw.type || "UNKNOWN")
      .trim()
      .toUpperCase(),

    dependencies: normalizeList(raw.dependencies),

    consumers: normalizeList(raw.consumers),

    sourceFile: raw._sourceFile || null,
  };
}
export function validateReferences(components) {
  const componentNames = new Set(
    components.map((component) => component.name)
  );

  const missingReferences = [];

  for (const component of components) {
    for (const dependency of component.dependencies) {
      if (!componentNames.has(dependency)) {
        missingReferences.push({
          component: component.name,
          referenceType: "dependency",
          reference: dependency,
        });
      }
    }

    for (const consumer of component.consumers) {
      if (!componentNames.has(consumer)) {
        missingReferences.push({
          component: component.name,
          referenceType: "consumer",
          reference: consumer,
        });
      }
    }
  }

  return missingReferences;
}