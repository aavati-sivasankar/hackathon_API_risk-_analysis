/**
 * Generate rule-based validation recommendations
 * from a change-impact analysis.
 *
 * These recommendations are inferred from:
 * - modified component type
 * - direct/indirect impact
 * - dependency relationships
 * - impact distance
 *
 * They do NOT claim knowledge of the actual
 * implementation or business logic.
 */

function createScopeItem(
  category,
  component,
  recommendation
) {
  return {
    category,
    component: {
      id: component.id,
      name: component.name,
      type: component.type,
    },
    recommendation,
  };
}

export function generateTestScope(
  impactResult,
  impactPaths = []
) {
  if (!impactResult) {
    throw new Error(
      "Impact result is required"
    );
  }

  const scope = [];

  const modified =
    impactResult.modified;

  /*
   * -----------------------------------------
   * 1. Modified component validation
   * -----------------------------------------
   */

  scope.push(
    createScopeItem(
      "modified-component",
      modified,
      `Validate the changed ${modified.type.toLowerCase()} behavior and interface`
    )
  );

  /*
   * -----------------------------------------
   * 2. Direct integration validation
   * -----------------------------------------
   */

  for (const component of impactResult.directImpact) {
    scope.push(
      createScopeItem(
        "direct-integration",
        component,
        `Validate integration between ${modified.name} and ${component.name}`
      )
    );
  }

  /*
   * -----------------------------------------
   * 3. Indirect regression validation
   * -----------------------------------------
   *
   * We prioritize components closer to the
   * modified component because they are reached
   * through fewer dependency hops.
   */

  const sortedIndirectImpact = [
    ...impactResult.indirectImpact,
  ].filter(
        (component) =>
        component.type !== "APPLICATION"
    )
    .sort((a, b) => {
    const pathA = impactPaths.find(
      (path) =>
        path.target.id === a.id
    );

    const pathB = impactPaths.find(
      (path) =>
        path.target.id === b.id
    );

    return (
      (pathA?.distance || Infinity) -
      (pathB?.distance || Infinity)
    );
  });

  for (const component of sortedIndirectImpact) {
    const pathInfo = impactPaths.find(
      (path) =>
        path.target.id === component.id
    );

    const distance =
      pathInfo?.distance || null;

    scope.push(
      createScopeItem(
        "indirect-regression",
        component,
        distance
          ? `Run regression validation because this component is ${distance} dependency hop(s) downstream`
          : `Run regression validation because this component is indirectly downstream`
      )
    );
  }

  /*
   * -----------------------------------------
   * 4. Application-level validation
   * -----------------------------------------
   *
   * Applications represent user-facing or
   * operational entry points.
   */

  const impactedApplications =
    impactResult.indirectImpact.filter(
      (component) =>
        component.type ===
        "APPLICATION"
    );

  for (const application of impactedApplications) {
    scope.push(
      createScopeItem(
        "application-regression",
        application,
        `Run application-level regression validation for ${application.name}`
      )
    );
  }

  /*
   * -----------------------------------------
   * 5. End-to-end validation
   * -----------------------------------------
   *
   * If the change propagates beyond the
   * immediate consumers, recommend broader
   * end-to-end validation.
   */

  if (
    impactResult.indirectImpact.length >
    0
  ) {
    scope.push({
      category: "end-to-end",
      component: null,
      recommendation:
        "Run an end-to-end validation flow covering the downstream dependency chain",
    });
  }

  return scope;
}