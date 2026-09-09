import { Handle, Position } from "@xyflow/react";

export default function ComponentNode({ data }) {
  const typeStyles = {
    API: {
      border: "border-blue-500",
      badge: "bg-blue-100 text-blue-700",
      icon: "⚙️",
    },

    APPLICATION: {
      border: "border-purple-500",
      badge: "bg-purple-100 text-purple-700",
      icon: "🖥️",
    },

    DATABASE: {
      border: "border-green-500",
      badge: "bg-green-100 text-green-700",
      icon: "🗄️",
    },

    EXTERNAL: {
      border: "border-orange-500",
      badge: "bg-orange-100 text-orange-700",
      icon: "🌐",
    },
  };

  const style = typeStyles[data.type] || {
    border: "border-gray-400",
    badge: "bg-gray-100 text-gray-700",
    icon: "📦",
  };

  const statusStyles = {
    normal: {
      container: "bg-white",
      status: "",
    },

    failed: {
      container:
        "bg-red-100 border-red-600 ring-4 ring-red-200",
      status: "FAILED",
    },

    "direct-impact": {
      container:
        "bg-orange-50 border-orange-500 ring-2 ring-orange-200",
      status: "DIRECT IMPACT",
    },

    "indirect-impact": {
      container:
        "bg-yellow-50 border-yellow-500 ring-2 ring-yellow-100",
      status: "INDIRECT IMPACT",
    },

    "change-modified": {
      container:
        "bg-blue-100 border-blue-600 ring-4 ring-blue-200",
      status: "MODIFIED",
    },

    "change-direct": {
      container:
        "bg-orange-50 border-orange-500 ring-2 ring-orange-200",
      status: "DIRECT IMPACT",
    },

    "change-indirect": {
      container:
        "bg-yellow-50 border-yellow-500 ring-2 ring-yellow-200",
      status: "INDIRECT IMPACT",
    },

    "search-focus": {
      container:
        "bg-blue-50 border-blue-600 ring-4 ring-blue-200",
      status: "SEARCH FOCUS",
    },

    "search-upstream": {
      container:
        "bg-purple-50 border-purple-500 ring-2 ring-purple-200",
      status: "UPSTREAM",
    },

    "search-downstream": {
      container:
        "bg-green-50 border-green-500 ring-2 ring-green-200",
      status: "DOWNSTREAM",
    },
  };

  const currentStatus =
    statusStyles[data.status || "normal"] ||
    statusStyles.normal;

  /*
   * ==========================================================
   * GRAPH INSIGHTS
   * ==========================================================
   *
   * These values are calculated in App.jsx / metricsAnalyzer.js
   * and passed through node.data.insights.
   */

  const insights = data.insights || {};

  const isMostConnected =
    insights.isMostConnected === true;

  const isCriticalCandidate =
    insights.isCriticalCandidate === true;

  const isLargeBlastRadius =
    insights.isLargeBlastRadius === true;

  const criticalityScore =
    insights.criticalityScore ??
    data.criticalityScore ??
    null;

  /*
   * Whether anything needs to be displayed
   * above the node.
   */
  const hasInsights =
    isMostConnected ||
    isCriticalCandidate ||
    isLargeBlastRadius ||
    criticalityScore !== null;

  return (
    <div className="relative">

      {/* =====================================================
          GRAPH INSIGHT LABELS
      ====================================================== */}

      {hasInsights && (
        <div
          className="
            absolute
            bottom-full
            left-1/2
            z-20
            mb-2
            flex
            w-max
            max-w-[260px]
            -translate-x-1/2
            flex-col
            items-center
            gap-1
          "
        >

          {/* MOST CONNECTED */}

          {isMostConnected && (
            <div
              className="
                flex
                items-center
                gap-1.5
                rounded-full
                border
                border-blue-200
                bg-blue-50
                px-2.5
                py-1
                text-[9px]
                font-bold
                uppercase
                tracking-wide
                text-blue-700
                shadow-sm
              "
            >
              <span>🔵</span>
              <span>Most Connected</span>
            </div>
          )}

          {/* CRITICAL CANDIDATE */}

          {isCriticalCandidate && (
            <div
              className="
                flex
                items-center
                gap-1.5
                rounded-full
                border
                border-red-200
                bg-red-50
                px-2.5
                py-1
                text-[9px]
                font-bold
                uppercase
                tracking-wide
                text-red-700
                shadow-sm
              "
            >
              <span>⚠️</span>
              <span>Critical Candidate</span>
            </div>
          )}

          {/* LARGE BLAST RADIUS */}

          {isLargeBlastRadius && (
            <div
              className="
                flex
                items-center
                gap-1.5
                rounded-full
                border
                border-orange-200
                bg-orange-50
                px-2.5
                py-1
                text-[9px]
                font-bold
                uppercase
                tracking-wide
                text-orange-700
                shadow-sm
              "
            >
              <span>🔥</span>
              <span>Large Blast Radius</span>
            </div>
          )}

          {/* CRITICALITY SCORE */}

          {criticalityScore !== null && (
            <div
              className="
                flex
                items-center
                gap-1.5
                rounded-full
                border
                border-purple-200
                bg-purple-50
                px-2.5
                py-1
                text-[9px]
                font-bold
                uppercase
                tracking-wide
                text-purple-700
                shadow-sm
              "
            >
              <span>★</span>

              <span>
                Criticality {criticalityScore}/100
              </span>
            </div>
          )}

          {/* CONNECTOR LINE */}

          <div
            className="
              h-2
              w-px
              bg-slate-300
            "
          />
        </div>
      )}

      {/* =====================================================
          MAIN NODE
      ====================================================== */}

      <div
        className={`
          relative
          w-[220px]
          rounded-xl
          border-2
          ${style.border}
          ${currentStatus.container}
          px-4
          py-3
          shadow-md
          transition-all
          duration-200
          hover:shadow-xl
        `}
      >

        {/* TARGET HANDLE */}

        <Handle
          type="target"
          position={Position.Left}
          className="
            !h-3
            !w-3
            !border-2
            !border-white
            !bg-slate-700
          "
        />

        {/* =================================================
            NODE HEADER
        ================================================== */}

        <div className="flex items-start gap-3">

          <div className="text-xl">
            {style.icon}
          </div>

          <div className="min-w-0 flex-1">

            <div
              className="
                truncate
                text-sm
                font-bold
                text-gray-900
              "
            >
              {data.name}
            </div>

            <span
              className={`
                mt-1
                inline-block
                rounded-full
                px-2
                py-0.5
                text-[10px]
                font-semibold
                ${style.badge}
              `}
            >
              {data.type}
            </span>

          </div>

        </div>

        {/* =================================================
            STATUS
        ================================================== */}

        {currentStatus.status && (
          <div
            className="
              mt-2
              rounded-md
              bg-white/70
              px-2
              py-1
              text-center
              text-[10px]
              font-bold
              tracking-wide
              text-gray-700
            "
          >
            {currentStatus.status}
          </div>
        )}

        {/* =================================================
            DEPENDENCIES / CONSUMERS
        ================================================== */}

        <div
          className="
            mt-3
            border-t
            border-gray-200
            pt-2
          "
        >

          <div
            className="
              flex
              justify-between
              text-[11px]
              text-gray-500
            "
          >
            <span>
              Dependencies
            </span>

            <span
              className="
                font-semibold
                text-gray-700
              "
            >
              {data.dependencies?.length || 0}
            </span>
          </div>

          <div
            className="
              mt-1
              flex
              justify-between
              text-[11px]
              text-gray-500
            "
          >
            <span>
              Consumers
            </span>

            <span
              className="
                font-semibold
                text-gray-700
              "
            >
              {data.consumers?.length || 0}
            </span>
          </div>

        </div>

        {/* SOURCE HANDLE */}

        <Handle
          type="source"
          position={Position.Right}
          className="
            !h-3
            !w-3
            !border-2
            !border-white
            !bg-slate-700
          "
        />

      </div>

    </div>
  );
}