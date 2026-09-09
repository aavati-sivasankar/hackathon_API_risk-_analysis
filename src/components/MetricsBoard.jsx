import { useMemo } from "react";

export default function MetricsBoard({ nodes = [], edges = [] }) {
  const metrics = useMemo(() => {
    const typeCounts = {
      API: 0,
      APPLICATION: 0,
      DATABASE: 0,
      EXTERNAL: 0,
    };

    for (const node of nodes) {
      const type = node.data?.type;

      if (typeCounts[type] !== undefined) {
        typeCounts[type]++;
      }
    }

    const dependencyCounts = new Map();
    const consumerCounts = new Map();

    for (const node of nodes) {
      dependencyCounts.set(node.id, 0);
      consumerCounts.set(node.id, 0);
    }

    /*
      Graph direction:

      dependency → dependent

      Example:

      Product DB
          ↓
      Product Catalog
          ↓
      Pricing
          ↓
      Order
    */

    for (const edge of edges) {
      // Incoming edge = this node depends on something
      dependencyCounts.set(
        edge.target,
        (dependencyCounts.get(edge.target) || 0) + 1
      );

      // Outgoing edge = something depends on this node
      consumerCounts.set(
        edge.source,
        (consumerCounts.get(edge.source) || 0) + 1
      );
    }

    const componentStats = nodes.map((node) => {
      const dependencies =
        dependencyCounts.get(node.id) || 0;

      const consumers =
        consumerCounts.get(node.id) || 0;

      return {
        id: node.id,
        name: node.data?.name || "Unknown",
        type: node.data?.type || "UNKNOWN",
        dependencies,
        consumers,
        totalConnections: dependencies + consumers,
      };
    });

    const mostConnected =
      [...componentStats].sort(
        (a, b) =>
          b.totalConnections - a.totalConnections
      )[0] || null;

    const highestDependencyLoad =
      [...componentStats].sort(
        (a, b) =>
          b.dependencies - a.dependencies
      )[0] || null;

    const mostDependedOn =
      [...componentStats].sort(
        (a, b) =>
          b.consumers - a.consumers
      )[0] || null;

    const averageDependencies =
      nodes.length > 0
        ? edges.length / nodes.length
        : 0;

    return {
      totalComponents: nodes.length,
      totalDependencies: edges.length,
      averageDependencies,

      typeCounts,

      componentStats,

      mostConnected,
      highestDependencyLoad,
      mostDependedOn,
    };
  }, [nodes, edges]);

  return (
    <div className="space-y-4">
      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          label="Components"
          value={metrics.totalComponents}
          description="Architecture components"
          icon="◈"
        />

        <MetricCard
          label="Dependencies"
          value={metrics.totalDependencies}
          description="Relationships in graph"
          icon="↗"
        />

        <MetricCard
          label="Avg. Dependencies"
          value={metrics.averageDependencies.toFixed(2)}
          description="Per component"
          icon="≈"
        />

        <MetricCard
          label="Most Connected"
          value={
            metrics.mostConnected?.name || "—"
          }
          description={
            metrics.mostConnected
              ? `${metrics.mostConnected.totalConnections} connections`
              : "No data"
          }
          icon="◎"
          compact
        />
      </div>

      {/* Architecture composition */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Architecture Composition
            </h3>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Components grouped by type
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <TypeMetric
            label="APIs"
            value={metrics.typeCounts.API}
            accent="blue"
          />

          <TypeMetric
            label="Applications"
            value={metrics.typeCounts.APPLICATION}
            accent="violet"
          />

          <TypeMetric
            label="Databases"
            value={metrics.typeCounts.DATABASE}
            accent="emerald"
          />

          <TypeMetric
            label="External"
            value={metrics.typeCounts.EXTERNAL}
            accent="amber"
          />
        </div>
      </div>

      {/* Dependency insights */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">
            Dependency Insights
          </h3>

          <p className="mt-0.5 text-[11px] text-slate-500">
            Structural observations from the dependency graph
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <InsightCard
            title="Highest Dependency Load"
            value={
              metrics.highestDependencyLoad?.name ||
              "—"
            }
            detail={
              metrics.highestDependencyLoad
                ? `${metrics.highestDependencyLoad.dependencies} direct dependencies`
                : "No data"
            }
            icon="↓"
          />

          <InsightCard
            title="Most Depended-On"
            value={
              metrics.mostDependedOn?.name ||
              "—"
            }
            detail={
              metrics.mostDependedOn
                ? `${metrics.mostDependedOn.consumers} direct consumers`
                : "No data"
            }
            icon="↑"
          />

          <InsightCard
            title="Critical Dependency Candidate"
            value={
              metrics.mostDependedOn?.name ||
              "—"
            }
            detail={
              metrics.mostDependedOn
                ? `Structural candidate with ${metrics.mostDependedOn.consumers} consumers`
                : "No data"
            }
            icon="⚠"
          />
        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------- */
/* Metric Card */
/* -------------------------------------------------- */

function MetricCard({
  label,
  value,
  description,
  icon,
  compact = false,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
          </p>

          <p
            className={`
              mt-2 truncate
              font-bold text-white
              ${compact ? "text-base" : "text-2xl"}
            `}
          >
            {value}
          </p>

          <p className="mt-1 text-[10px] text-slate-600">
            {description}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sm text-slate-400">
          {icon}
        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------- */
/* Type Metric */
/* -------------------------------------------------- */

function TypeMetric({
  label,
  value,
  accent,
}) {
  const styles = {
    blue: {
      dot: "bg-blue-400",
      text: "text-blue-300",
    },
    violet: {
      dot: "bg-violet-400",
      text: "text-violet-300",
    },
    emerald: {
      dot: "bg-emerald-400",
      text: "text-emerald-300",
    },
    amber: {
      dot: "bg-amber-400",
      text: "text-amber-300",
    },
  };

  const style = styles[accent];

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${style.dot}`}
        />

        <span className="text-xs text-slate-400">
          {label}
        </span>
      </div>

      <span
        className={`text-sm font-bold ${style.text}`}
      >
        {value}
      </span>
    </div>
  );
}


/* -------------------------------------------------- */
/* Insight Card */
/* -------------------------------------------------- */

function InsightCard({
  title,
  value,
  detail,
  icon,
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-400">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
            {title}
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}