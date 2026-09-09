import { useMemo, useState } from "react";

import ArchitectureGraph from "./components/ArchitectureGraph";

import { loadYamlDataset } from "./parser/datasetLoader";
import { buildGraph } from "./graph/graphBuilder";
import { layoutGraph } from "./graph/graphLayout";

import { analyzeFailure } from "./analysis/failureAnalyzer";

import {
  analyzeChangeImpact,
} from "./analysis/changeImpactAnalyzer";

import {
  getChangeImpactPaths,
} from "./analysis/changeImpactPaths";

import {
  generateTestScope,
} from "./analysis/testScopeAnalyzer";

import {
  analyzeGraphMetrics,
} from "./analysis/metricsAnalyzer";


/* ============================================================
   YAML DATASET
============================================================ */

const yamlFiles = import.meta.glob(
  "./data/yaml/**/*.yaml",
  {
    query: "?raw",
    import: "default",
    eager: true,
  }
);


/* ============================================================
   FAILURE IMPACT EDGE IDS
============================================================ */

function getImpactEdgeIds(
  edges,
  failureResult
) {
  if (!failureResult) {
    return new Set();
  }

  const impactedIds = new Set([
    failureResult.failed.id,

    ...failureResult.directImpact.map(
      (node) => node.id
    ),

    ...failureResult.indirectImpact.map(
      (node) => node.id
    ),
  ]);

  const edgeIds = new Set();

  const queue = [
    failureResult.failed.id,
  ];

  const visited = new Set([
    failureResult.failed.id,
  ]);

  while (queue.length > 0) {
    const currentId = queue.shift();

    for (const edge of edges) {
      if (edge.source !== currentId) {
        continue;
      }

      if (!impactedIds.has(edge.target)) {
        continue;
      }

      edgeIds.add(edge.id);

      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return edgeIds;
}


/* ============================================================
   SEARCH EDGE IDS
============================================================ */

function getSearchEdgeIds(
  edges,
  searchFocusedNode
) {
  if (!searchFocusedNode) {
    return new Set();
  }

  const searchNodeId =
    searchFocusedNode.id;

  return new Set(
    edges
      .filter(
        (edge) =>
          edge.source === searchNodeId ||
          edge.target === searchNodeId
      )
      .map((edge) => edge.id)
  );
}


/* ============================================================
   CHANGE IMPACT EDGE IDS
============================================================ */

function getChangeImpactEdgeIds(
  edges,
  changeImpactResult
) {
  if (!changeImpactResult) {
    return new Set();
  }

  const impactedIds = new Set([
    changeImpactResult.modified.id,

    ...changeImpactResult.directImpact.map(
      (node) => node.id
    ),

    ...changeImpactResult.indirectImpact.map(
      (node) => node.id
    ),
  ]);

  const edgeIds = new Set();

  const queue = [
    changeImpactResult.modified.id,
  ];

  const visited = new Set([
    changeImpactResult.modified.id,
  ]);

  while (queue.length > 0) {
    const currentId = queue.shift();

    for (const edge of edges) {
      if (edge.source !== currentId) {
        continue;
      }

      if (!impactedIds.has(edge.target)) {
        continue;
      }

      edgeIds.add(edge.id);

      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return edgeIds;
}


/* ============================================================
   APP
============================================================ */

function App() {

  /* ==========================================================
     STATE
  ========================================================== */

  const [
    selectedNode,
    setSelectedNode,
  ] = useState(null);

  const [
    failureResult,
    setFailureResult,
  ] = useState(null);

  const [
    changeImpactResult,
    setChangeImpactResult,
  ] = useState(null);

  const [
    changeImpactPaths,
    setChangeImpactPaths,
  ] = useState([]);

  const [
    testScope,
    setTestScope,
  ] = useState([]);

  const [
    showTestScope,
    setShowTestScope,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    searchFocusedNode,
    setSearchFocusedNode,
  ] = useState(null);


  /* ==========================================================
     BUILD GRAPH
  ========================================================== */

  const graph = useMemo(() => {

    const dataset =
      loadYamlDataset(yamlFiles);

    const builtGraph =
      buildGraph(
        dataset.components
      );

    return layoutGraph(
      builtGraph
    );

  }, []);


  /* ==========================================================
     NORMAL GRAPH METRICS
  ========================================================== */

  const graphMetrics = useMemo(() => {

    return analyzeGraphMetrics(
      graph.nodes,
      graph.edges
    );

  }, [
    graph.nodes,
    graph.edges,
  ]);


  /* ==========================================================
     SEARCH RESULTS
  ========================================================== */

  const searchResults = useMemo(() => {

    const query =
      searchQuery
        .trim()
        .toLowerCase();

    if (!query) {
      return [];
    }

    return graph.nodes.filter(
      (node) =>
        node.data.name
          .toLowerCase()
          .includes(query)
    );

  }, [
    graph.nodes,
    searchQuery,
  ]);


  /* ==========================================================
     NODE CLICK
  ========================================================== */

  function handleNodeClick(
    event,
    node
  ) {

    setSelectedNode(node);

    setSearchFocusedNode(node);

  }


  /* ==========================================================
     SIMULATE FAILURE
  ========================================================== */

  function simulateFailure() {

    if (!selectedNode) {
      return;
    }

    /*
     * Failure mode becomes active.
     *
     * Clear change analysis.
     */

    setChangeImpactResult(null);

    setChangeImpactPaths([]);

    setTestScope([]);

    setShowTestScope(false);

    const result =
      analyzeFailure(
        graph.nodes,
        graph.edges,
        selectedNode.id
      );

    setFailureResult(result);

  }


  /* ==========================================================
     CLEAR FAILURE
  ========================================================== */

  function clearFailure() {

    setFailureResult(null);

  }


  /* ==========================================================
     SIMULATE CHANGE
  ========================================================== */

  function simulateChange() {

    if (!selectedNode) {
      return;
    }

    /*
     * Change mode becomes active.
     *
     * Clear failure mode.
     */

    setFailureResult(null);

    setShowTestScope(false);

    const result =
      analyzeChangeImpact(
        graph.nodes,
        graph.edges,
        selectedNode.id
      );

    const paths =
      getChangeImpactPaths(
        graph.nodes,
        graph.edges,
        selectedNode.id
      );

    /*
     * Generate rule-based
     * validation recommendations.
     */

    const scope =
      generateTestScope(
        result,
        paths
      );

    setChangeImpactResult(result);

    setChangeImpactPaths(paths);

    setTestScope(scope);

  }


  /* ==========================================================
     CLEAR CHANGE IMPACT
  ========================================================== */

  function clearChangeImpact() {

    setChangeImpactResult(null);

    setChangeImpactPaths([]);

    setTestScope([]);

    setShowTestScope(false);

  }


  /* ==========================================================
     FAILURE IDS
  ========================================================== */

  const directImpactIds =
    new Set(
      failureResult?.directImpact.map(
        (node) => node.id
      ) || []
    );


  const indirectImpactIds =
    new Set(
      failureResult?.indirectImpact.map(
        (node) => node.id
      ) || []
    );


  /* ==========================================================
     CHANGE IDS
  ========================================================== */

  const changeDirectIds =
    new Set(
      changeImpactResult?.directImpact.map(
        (node) => node.id
      ) || []
    );


  const changeIndirectIds =
    new Set(
      changeImpactResult?.indirectImpact.map(
        (node) => node.id
      ) || []
    );


  /* ==========================================================
     SEARCH UPSTREAM / DOWNSTREAM
  ========================================================== */

  const searchUpstreamIds =
    new Set();

  const searchDownstreamIds =
    new Set();


  if (searchFocusedNode) {

    for (const node of graph.nodes) {

      /*
       * Direct dependencies
       */

      if (
        searchFocusedNode.data.dependencies?.includes(
          node.data.name
        )
      ) {

        searchUpstreamIds.add(
          node.id
        );

      }


      /*
       * Direct consumers
       */

      if (
        searchFocusedNode.data.consumers?.includes(
          node.data.name
        )
      ) {

        searchDownstreamIds.add(
          node.id
        );

      }

    }

  }


  /* ==========================================================
     FAILURE EDGES
  ========================================================== */

  const impactEdgeIds =
    getImpactEdgeIds(
      graph.edges,
      failureResult
    );


  /* ==========================================================
     CHANGE EDGES
  ========================================================== */

  const changeImpactEdgeIds =
    getChangeImpactEdgeIds(
      graph.edges,
      changeImpactResult
    );


  /* ==========================================================
     SEARCH EDGES
  ========================================================== */

  const searchEdgeIds =
    getSearchEdgeIds(
      graph.edges,
      searchFocusedNode
    );


  /* ==========================================================
     DISPLAY NODES
  ========================================================== */

  const displayNodes =
    graph.nodes.map((node) => {

      let status = "normal";

      /*
       * ------------------------------------------------------
       * NORMAL GRAPH INSIGHTS
       * ------------------------------------------------------
       */

      const nodeMetric =
        graphMetrics.componentMetrics.find(
          (item) =>
            item.id === node.id
        );


      let graphInsight = null;


      /*
       * CRITICAL CANDIDATE
       *
       * Highest suggested structural
       * criticality score.
       */

      if (
        graphMetrics.criticalCandidate?.id ===
        node.id
      ) {

        graphInsight = {
          type: "critical-candidate",

          label: "CRITICAL CANDIDATE",

          value:
            `${nodeMetric?.criticalityScore || 0}/100`,
        };

      }


      /*
       * MOST CONNECTED
       */

      else if (
        graphMetrics.mostConnected?.id ===
        node.id
      ) {

        graphInsight = {
          type: "most-connected",

          label: "MOST CONNECTED",

          value:
            `${nodeMetric?.totalConnections || 0} connections`,
        };

      }


      /*
       * LARGE BLAST RADIUS
       */

      else if (
        graphMetrics
          .largeBlastRadiusCandidate
          ?.id === node.id
      ) {

        graphInsight = {
          type: "large-blast-radius",

          label: "LARGE BLAST RADIUS",

          value:
            `${nodeMetric?.downstreamCount || 0} downstream`,
        };

      }


      /* ------------------------------------------------------
         FAILURE MODE
      ------------------------------------------------------ */

      if (
        failureResult?.failed.id ===
        node.id
      ) {

        status = "failed";

      }

      else if (
        directImpactIds.has(
          node.id
        )
      ) {

        status = "direct-impact";

      }

      else if (
        indirectImpactIds.has(
          node.id
        )
      ) {

        status = "indirect-impact";

      }


      /* ------------------------------------------------------
         CHANGE IMPACT MODE
      ------------------------------------------------------ */

      if (changeImpactResult) {

        if (
          changeImpactResult.modified.id ===
          node.id
        ) {

          status =
            "change-modified";

        }

        else if (
          changeDirectIds.has(
            node.id
          )
        ) {

          status =
            "change-direct";

        }

        else if (
          changeIndirectIds.has(
            node.id
          )
        ) {

          status =
            "change-indirect";

        }

        else {

          status =
            "normal";

        }

      }


      /* ------------------------------------------------------
         SEARCH MODE
      ------------------------------------------------------ */

      if (
        searchFocusedNode &&
        !failureResult &&
        !changeImpactResult
      ) {

        if (
          searchFocusedNode.id ===
          node.id
        ) {

          status =
            "search-focus";

        }

        else if (
          searchUpstreamIds.has(
            node.id
          )
        ) {

          status =
            "search-upstream";

        }

        else if (
          searchDownstreamIds.has(
            node.id
          )
        ) {

          status =
            "search-downstream";

        }

      }


      /* ------------------------------------------------------
         RETURN NODE
      ------------------------------------------------------ */

      return {

        ...node,

        data: {

          ...node.data,

          status,

          /*
           * Normal graph insight.
           */

          graphInsight,

          /*
           * Structural metrics.
           */

          criticalityScore:
            nodeMetric
              ?.criticalityScore || 0,

          downstreamCount:
            nodeMetric
              ?.downstreamCount || 0,

          totalConnections:
            nodeMetric
              ?.totalConnections || 0,

        },

      };

    });


  /* ==========================================================
     FAILURE BLAST RADIUS
  ========================================================== */

  const failureBlastRadius =
    failureResult
      ? (
          (
            failureResult.totalAffected /
            graph.nodes.length
          ) *
          100
        ).toFixed(1)
      : null;


  /* ==========================================================
     CHANGE BLAST RADIUS
  ========================================================== */

  const changeBlastRadius =
    changeImpactResult
      ? (
          (
            changeImpactResult.totalAffected /
            graph.nodes.length
          ) *
          100
        ).toFixed(1)
      : null;


  /* ==========================================================
     RENDER
  ========================================================== */

  return (

    <div className="h-screen w-screen overflow-hidden bg-slate-50">


      {/* ======================================================
          HEADER
      ======================================================= */}

      <header
        className="
          flex
          h-20
          shrink-0
          items-center
          justify-between
          border-b
          border-slate-200
          bg-white
          px-5
          shadow-sm
        "
      >

        {/* ----------------------------------------------------
            TITLE
        ----------------------------------------------------- */}

        <div className="min-w-[250px]">

          <h1
            className="
              text-xl
              font-bold
              tracking-tight
              text-slate-900
            "
          >
            API Dependency Visualizer
          </h1>

          <p
            className="
              mt-0.5
              text-xs
              text-slate-500
            "
          >
            Architecture & Dependency Analysis
          </p>

        </div>


        {/* ----------------------------------------------------
            HEADER METRICS
        ----------------------------------------------------- */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          {/* SERVICES */}

          <div
            className="
              flex
              min-w-[120px]
              items-center
              gap-3
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              shadow-sm
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-blue-50
                text-blue-600
              "
            >
              ⚙
            </div>

            <div>

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-widest
                  text-slate-400
                "
              >
                Services
              </p>

              <p
                className="
                  text-lg
                  font-bold
                  leading-none
                  text-blue-600
                "
              >
                {graphMetrics.totalServices}
              </p>

            </div>

          </div>


          {/* APPLICATIONS */}

          <div
            className="
              flex
              min-w-[120px]
              items-center
              gap-3
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              shadow-sm
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-purple-50
                text-purple-600
              "
            >
              ▣
            </div>

            <div>

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-widest
                  text-slate-400
                "
              >
                Applications
              </p>

              <p
                className="
                  text-lg
                  font-bold
                  leading-none
                  text-purple-600
                "
              >
                {graphMetrics.totalApplications}
              </p>

            </div>

          </div>


          {/* DATABASES */}

          <div
            className="
              flex
              min-w-[120px]
              items-center
              gap-3
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              shadow-sm
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-emerald-50
                text-emerald-600
              "
            >
              ◉
            </div>

            <div>

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-widest
                  text-slate-400
                "
              >
                Databases
              </p>

              <p
                className="
                  text-lg
                  font-bold
                  leading-none
                  text-emerald-600
                "
              >
                {graphMetrics.totalDatabases}
              </p>

            </div>

          </div>


          {/* EXTERNAL */}

          <div
            className="
              flex
              min-w-[120px]
              items-center
              gap-3
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              shadow-sm
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-orange-50
                text-orange-600
              "
            >
              ◎
            </div>

            <div>

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-widest
                  text-slate-400
                "
              >
                External
              </p>

              <p
                className="
                  text-lg
                  font-bold
                  leading-none
                  text-orange-600
                "
              >
                {graphMetrics.totalExternalSystems}
              </p>

            </div>

          </div>


          {/* COMPONENTS */}

          <div
            className="
              flex
              min-w-[120px]
              items-center
              gap-3
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              shadow-sm
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-slate-100
                text-slate-700
              "
            >
              ◆
            </div>

            <div>

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-widest
                  text-slate-400
                "
              >
                Components
              </p>

              <p
                className="
                  text-lg
                  font-bold
                  leading-none
                  text-slate-700
                "
              >
                {graphMetrics.totalComponents}
              </p>

            </div>

          </div>


          {/* --------------------------------------------------
              SEARCH
          --------------------------------------------------- */}

          <div
            className="
              relative
              ml-3
              w-64
            "
          >

            <div
              className="
                pointer-events-none
                absolute
                inset-y-0
                left-0
                flex
                items-center
                pl-3
                text-slate-400
              "
            >
              🔍
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {

                setSearchQuery(
                  event.target.value
                );

                setSearchFocusedNode(
                  null
                );

              }}
              placeholder="Search components..."
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-slate-50
                py-2.5
                pl-10
                pr-4
                text-sm
                text-slate-700
                outline-none
                transition
                focus:border-blue-500
                focus:bg-white
                focus:ring-2
                focus:ring-blue-100
              "
            />


            {/* SEARCH RESULTS */}

            {searchQuery.trim() && (

              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-12
                  z-50
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  shadow-2xl
                "
              >

                {searchResults.length > 0 ? (

                  <div
                    className="
                      max-h-72
                      overflow-y-auto
                      py-1
                    "
                  >

                    {searchResults.map(
                      (node) => (

                        <button
                          key={node.id}
                          onClick={() => {

                            setSearchFocusedNode(
                              node
                            );

                            setSelectedNode(
                              node
                            );

                            setSearchQuery(
                              ""
                            );

                          }}
                          className="
                            w-full
                            px-4
                            py-3
                            text-left
                            transition
                            hover:bg-blue-50
                          "
                        >

                          <div
                            className="
                              font-semibold
                              text-slate-900
                            "
                          >
                            {node.data.name}
                          </div>

                          <div
                            className="
                              mt-1
                              flex
                              items-center
                              gap-2
                            "
                          >

                            <span
                              className="
                                rounded-full
                                bg-slate-100
                                px-2
                                py-0.5
                                text-[10px]
                                font-semibold
                                text-slate-600
                              "
                            >
                              {node.data.type}
                            </span>

                            <span
                              className="
                                text-xs
                                text-slate-400
                              "
                            >
                              {
                                node.data
                                  .dependencies
                                  ?.length || 0
                              }{" "}
                              dependencies
                            </span>

                            <span
                              className="
                                text-xs
                                text-slate-400
                              "
                            >
                              {
                                node.data
                                  .consumers
                                  ?.length || 0
                              }{" "}
                              consumers
                            </span>

                          </div>

                        </button>

                      )
                    )}

                  </div>

                ) : (

                  <div
                    className="
                      px-4
                      py-4
                      text-sm
                      text-slate-500
                    "
                  >
                    No components found
                  </div>

                )}

              </div>

            )}

          </div>

        </div>

      </header>


      {/* ======================================================
          GRAPH AREA
      ======================================================= */}

      <main
        className="
          relative
          h-[calc(100vh-5rem)]
          w-full
        "
      >

        <ArchitectureGraph

          nodes={displayNodes}

          edges={
            graph.edges.map(
              (edge) => {

                let status =
                  "normal";


                /* FAILURE */

                if (failureResult) {

                  status =
                    impactEdgeIds.has(
                      edge.id
                    )
                      ? "impact"
                      : "normal-muted";

                }


                /* CHANGE */

                else if (
                  changeImpactResult
                ) {

                  status =
                    changeImpactEdgeIds.has(
                      edge.id
                    )
                      ? "change-impact"
                      : "normal-muted";

                }


                /* SEARCH */

                else if (
                  searchFocusedNode
                ) {

                  status =
                    searchEdgeIds.has(
                      edge.id
                    )
                      ? "search-impact"
                      : "normal-muted";

                }


                return {

                  ...edge,

                  data: {

                    ...edge.data,

                    status,

                  },

                };

              }
            )
          }

          onNodeClick={
            handleNodeClick
          }

          focusNodeId={
            searchFocusedNode?.id
          }

        />


        {/* ====================================================
            GRAPH INSIGHTS LEGEND
        ===================================================== */}

        {!failureResult &&
          !changeImpactResult &&
          !searchFocusedNode && (

          <div
            className="
              absolute
              bottom-5
              left-5
              z-10
              rounded-xl
              border
              border-slate-200
              bg-white/95
              p-4
              shadow-lg
              backdrop-blur
            "
          >

            <p
              className="
                mb-3
                text-[10px]
                font-bold
                uppercase
                tracking-widest
                text-slate-400
              "
            >
              Graph Insights
            </p>

            <div
              className="
                space-y-2
                text-xs
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <span
                  className="
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-blue-500
                  "
                />

                <span
                  className="
                    text-slate-600
                  "
                >
                  Most connected
                </span>

              </div>


              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <span
                  className="
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-red-500
                  "
                />

                <span
                  className="
                    text-slate-600
                  "
                >
                  Critical candidate
                </span>

              </div>


              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <span
                  className="
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-orange-500
                  "
                />

                <span
                  className="
                    text-slate-600
                  "
                >
                  Large blast radius
                </span>

              </div>

            </div>

          </div>

        )}


        {/* ====================================================
            SELECTED COMPONENT PANEL
        ===================================================== */}

        {selectedNode &&
          !failureResult &&
          !changeImpactResult && (

          <div
            className="
              absolute
              right-4
              top-4
              z-10
              w-80
              rounded-xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-xl
            "
          >

            {/* HEADER */}

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-slate-900
                  "
                >
                  {selectedNode.data.name}
                </h2>

                <span
                  className="
                    mt-1
                    inline-block
                    rounded-full
                    bg-slate-100
                    px-2
                    py-1
                    text-xs
                    font-semibold
                    text-slate-600
                  "
                >
                  {selectedNode.data.type}
                </span>

              </div>

              <button
                onClick={() => {

                  setSelectedNode(
                    null
                  );

                  setSearchFocusedNode(
                    null
                  );

                }}
                className="
                  rounded-md
                  px-2
                  py-1
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-700
                "
              >
                ✕
              </button>

            </div>


            {/* STRUCTURAL METRICS */}

            {(() => {

              const metric =
                graphMetrics.componentMetrics.find(
                  (item) =>
                    item.id ===
                    selectedNode.id
                );

              if (!metric) {
                return null;
              }

              return (

                <div
                  className="
                    mt-4
                    rounded-lg
                    bg-slate-50
                    p-3
                  "
                >

                  <div
                    className="
                      mb-2
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-widest
                      text-slate-400
                    "
                  >
                    Graph Metrics
                  </div>

                  <div
                    className="
                      grid
                      grid-cols-2
                      gap-2
                    "
                  >

                    <div>

                      <p className="text-[10px] text-slate-400">
                        Connections
                      </p>

                      <p className="text-sm font-bold text-slate-800">
                        {metric.totalConnections}
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] text-slate-400">
                        Downstream
                      </p>

                      <p className="text-sm font-bold text-slate-800">
                        {metric.downstreamCount}
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] text-slate-400">
                        Consumers
                      </p>

                      <p className="text-sm font-bold text-slate-800">
                        {metric.consumers}
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] text-slate-400">
                        Criticality
                      </p>

                      <p className="text-sm font-bold text-red-600">
                        {metric.criticalityScore}/100
                      </p>

                    </div>

                  </div>

                </div>

              );

            })()}


            {/* DEPENDENCIES */}

            <div className="mt-5">

              <h3
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Dependencies
              </h3>

              {selectedNode.data.dependencies?.length > 0 ? (

                <ul
                  className="
                    mt-2
                    space-y-1
                  "
                >

                  {selectedNode.data.dependencies.map(
                    (dependency) => (

                      <li
                        key={dependency}
                        className="
                          rounded-md
                          bg-slate-50
                          px-3
                          py-2
                          text-sm
                          text-slate-700
                        "
                      >
                        {dependency}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-400
                  "
                >
                  No dependencies
                </p>

              )}

            </div>


            {/* CONSUMERS */}

            <div className="mt-5">

              <h3
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Consumers
              </h3>

              {selectedNode.data.consumers?.length > 0 ? (

                <ul
                  className="
                    mt-2
                    space-y-1
                  "
                >

                  {selectedNode.data.consumers.map(
                    (consumer) => (

                      <li
                        key={consumer}
                        className="
                          rounded-md
                          bg-slate-50
                          px-3
                          py-2
                          text-sm
                          text-slate-700
                        "
                      >
                        {consumer}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-400
                  "
                >
                  No consumers
                </p>

              )}

            </div>


            {/* SIMULATION BUTTONS */}

            <div
              className="
                mt-6
                space-y-2
              "
            >

              <button
                onClick={
                  simulateFailure
                }
                className="
                  w-full
                  rounded-lg
                  bg-red-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-red-700
                "
              >
                Simulate Failure
              </button>

              <button
                onClick={
                  simulateChange
                }
                className="
                  w-full
                  rounded-lg
                  bg-blue-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-700
                "
              >
                Simulate Change
              </button>

            </div>

          </div>

        )}


        {/* ====================================================
            FAILURE RESULT PANEL
        ===================================================== */}

        {failureResult && (

          <div
            className="
              absolute
              right-4
              top-4
              z-10
              w-96
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-xl
            "
          >

            {/* HEADER */}

            <div
              className="
                border-b
                bg-red-50
                px-5
                py-4
              "
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-red-600
                    "
                  >
                    Failure Simulation
                  </p>

                  <h2
                    className="
                      mt-1
                      text-lg
                      font-bold
                      text-slate-900
                    "
                  >
                    {failureResult.failed.name}
                  </h2>

                </div>

                <button
                  onClick={
                    clearFailure
                  }
                  className="
                    rounded-md
                    px-2
                    py-1
                    text-slate-400
                    hover:bg-white
                    hover:text-slate-700
                  "
                >
                  ✕
                </button>

              </div>

            </div>


            {/* METRICS */}

            <div
              className="
                grid
                grid-cols-3
                gap-2
                p-4
              "
            >

              <div
                className="
                  rounded-lg
                  bg-red-50
                  p-3
                  text-center
                "
              >

                <p
                  className="
                    text-2xl
                    font-bold
                    text-red-600
                  "
                >
                  1
                </p>

                <p
                  className="
                    text-[11px]
                    text-slate-500
                  "
                >
                  Failed
                </p>

              </div>


              <div
                className="
                  rounded-lg
                  bg-orange-50
                  p-3
                  text-center
                "
              >

                <p
                  className="
                    text-2xl
                    font-bold
                    text-orange-600
                  "
                >
                  {
                    failureResult
                      .directImpact
                      .length
                  }
                </p>

                <p
                  className="
                    text-[11px]
                    text-slate-500
                  "
                >
                  Direct
                </p>

              </div>


              <div
                className="
                  rounded-lg
                  bg-yellow-50
                  p-3
                  text-center
                "
              >

                <p
                  className="
                    text-2xl
                    font-bold
                    text-yellow-600
                  "
                >
                  {
                    failureResult
                      .indirectImpact
                      .length
                  }
                </p>

                <p
                  className="
                    text-[11px]
                    text-slate-500
                  "
                >
                  Indirect
                </p>

              </div>

            </div>


            {/* TOTAL */}

            <div
              className="
                border-t
                px-5
                py-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <span
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Total affected
                </span>

                <span
                  className="
                    text-lg
                    font-bold
                    text-slate-900
                  "
                >
                  {
                    failureResult.totalAffected
                  }
                </span>

              </div>


              <div
                className="
                  mt-2
                  flex
                  items-center
                  justify-between
                "
              >

                <span
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Blast radius
                </span>

                <span
                  className="
                    text-lg
                    font-bold
                    text-red-600
                  "
                >
                  {failureBlastRadius}%
                </span>

              </div>

            </div>


            {/* IMPACT LISTS */}

            <div
              className="
                max-h-72
                overflow-y-auto
                border-t
                px-5
                py-4
              "
            >

              <h3
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Direct Impact
              </h3>

              <div
                className="
                  mt-2
                  space-y-1
                "
              >

                {failureResult.directImpact.map(
                  (node) => (

                    <div
                      key={node.id}
                      className="
                        rounded-md
                        bg-orange-50
                        px-3
                        py-2
                        text-sm
                        text-orange-800
                      "
                    >
                      {node.name}
                    </div>

                  )
                )}

              </div>


              <h3
                className="
                  mt-5
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Indirect Impact
              </h3>

              <div
                className="
                  mt-2
                  space-y-1
                "
              >

                {failureResult.indirectImpact.map(
                  (node) => (

                    <div
                      key={node.id}
                      className="
                        rounded-md
                        bg-yellow-50
                        px-3
                        py-2
                        text-sm
                        text-yellow-800
                      "
                    >
                      {node.name}
                    </div>

                  )
                )}

              </div>

            </div>


            {/* CLEAR */}

            <div
              className="
                border-t
                p-4
              "
            >

              <button
                onClick={
                  clearFailure
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-slate-50
                "
              >
                Clear Simulation
              </button>

            </div>

          </div>

        )}


        {/* ====================================================
            CHANGE IMPACT RESULT PANEL
        ===================================================== */}

        {changeImpactResult && (

          <div
            className="
              absolute
              right-4
              top-4
              z-10
              flex
              max-h-[calc(100vh-7rem)]
              w-[460px]
              flex-col
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-xl
            "
          >

            {/* HEADER */}

            <div
              className="
                border-b
                bg-blue-50
                px-5
                py-4
              "
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-blue-600
                    "
                  >
                    Change Impact Analysis
                  </p>

                  <h2
                    className="
                      mt-1
                      text-lg
                      font-bold
                      text-slate-900
                    "
                  >
                    {
                      changeImpactResult
                        .modified
                        .name
                    }
                  </h2>

                </div>

                <button
                  onClick={
                    clearChangeImpact
                  }
                  className="
                    rounded-md
                    px-2
                    py-1
                    text-slate-400
                    hover:bg-white
                    hover:text-slate-700
                  "
                >
                  ✕
                </button>

              </div>

            </div>


            {/* METRICS */}

            <div
              className="
                grid
                grid-cols-3
                gap-2
                p-4
              "
            >

              <div
                className="
                  rounded-lg
                  bg-orange-50
                  p-3
                  text-center
                "
              >

                <p
                  className="
                    text-2xl
                    font-bold
                    text-orange-600
                  "
                >
                  {
                    changeImpactResult
                      .directImpact
                      .length
                  }
                </p>

                <p
                  className="
                    text-[11px]
                    text-slate-500
                  "
                >
                  Direct
                </p>

              </div>


              <div
                className="
                  rounded-lg
                  bg-yellow-50
                  p-3
                  text-center
                "
              >

                <p
                  className="
                    text-2xl
                    font-bold
                    text-yellow-600
                  "
                >
                  {
                    changeImpactResult
                      .indirectImpact
                      .length
                  }
                </p>

                <p
                  className="
                    text-[11px]
                    text-slate-500
                  "
                >
                  Indirect
                </p>

              </div>


              <div
                className="
                  rounded-lg
                  bg-blue-50
                  p-3
                  text-center
                "
              >

                <p
                  className="
                    text-2xl
                    font-bold
                    text-blue-600
                  "
                >
                  {
                    changeImpactResult
                      .totalAffected
                  }
                </p>

                <p
                  className="
                    text-[11px]
                    text-slate-500
                  "
                >
                  Total
                </p>

              </div>

            </div>


            {/* BLAST RADIUS */}

            <div
              className="
                border-t
                px-5
                py-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <span
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Potential blast radius
                </span>

                <span
                  className="
                    text-lg
                    font-bold
                    text-blue-600
                  "
                >
                  {changeBlastRadius}%
                </span>

              </div>

            </div>


            {/* DETAILS */}

            <div
              className="
                max-h-[calc(100vh-18rem)]
                overflow-y-auto
                border-t
                px-5
                py-4
              "
            >

              {/* DIRECT */}

              <h3
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Direct Impact
              </h3>

              <div
                className="
                  mt-2
                  space-y-1
                "
              >

                {changeImpactResult.directImpact.map(
                  (node) => (

                    <div
                      key={node.id}
                      className="
                        rounded-md
                        bg-orange-50
                        px-3
                        py-2
                        text-sm
                        text-orange-800
                      "
                    >

                      <div
                        className="font-medium"
                      >
                        {node.name}
                      </div>

                      <div
                        className="
                          mt-0.5
                          text-[10px]
                          text-orange-600
                        "
                      >
                        Direct dependency
                      </div>

                    </div>

                  )
                )}

              </div>


              {/* INDIRECT */}

              <h3
                className="
                  mt-5
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Indirect Impact
              </h3>

              <div
                className="
                  mt-2
                  space-y-2
                "
              >

                {changeImpactResult.indirectImpact.map(
                  (node) => {

                    const path =
                      changeImpactPaths.find(
                        (item) =>
                          item.target.id ===
                          node.id
                      );

                    return (

                      <div
                        key={node.id}
                        className="
                          rounded-md
                          bg-yellow-50
                          px-3
                          py-2
                        "
                      >

                        <div
                          className="
                            text-sm
                            font-medium
                            text-yellow-800
                          "
                        >
                          {node.name}
                        </div>


                        {path && (

                          <>

                            <div
                              className="
                                mt-1
                                text-[10px]
                                font-medium
                                text-yellow-700
                              "
                            >
                              Distance:{" "}
                              {path.distance}{" "}
                              hop
                              {path.distance !== 1
                                ? "s"
                                : ""}
                            </div>


                            <div
                              className="
                                mt-1
                                text-[10px]
                                leading-relaxed
                                text-yellow-700
                              "
                            >
                              {path.path
                                .map(
                                  (item) =>
                                    item.name
                                )
                                .join(
                                  " → "
                                )}
                            </div>

                          </>

                        )}

                      </div>

                    );

                  }
                )}

              </div>


              {/* TEST SCOPE */}

              <div
                className="
                  mt-6
                  border-t
                  pt-5
                "
              >

                <button
                  onClick={() =>
                    setShowTestScope(
                      true
                    )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-blue-200
                    bg-blue-50
                    px-4
                    py-3
                    text-left
                    transition
                    hover:bg-blue-100
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-100
                        text-blue-600
                      "
                    >
                      ✓
                    </div>

                    <div
                      className="flex-1"
                    >

                      <div
                        className="
                          text-sm
                          font-semibold
                          text-blue-900
                        "
                      >
                        View Suggested Test Scope
                      </div>

                      <div
                        className="
                          mt-0.5
                          text-[11px]
                          text-blue-600
                        "
                      >
                        {testScope.length}{" "}
                        validation recommendations
                      </div>

                    </div>

                    <span
                      className="
                        text-blue-500
                      "
                    >
                      →
                    </span>

                  </div>

                </button>

              </div>

            </div>


            {/* CLEAR */}

            <div
              className="
                border-t
                p-4
              "
            >

              <button
                onClick={
                  clearChangeImpact
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-slate-50
                "
              >
                Clear Change Analysis
              </button>

            </div>

          </div>

        )}


        {/* ====================================================
            TEST SCOPE MODAL
        ===================================================== */}

        {showTestScope && (

          <div
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              bg-black/40
              p-4
              backdrop-blur-sm
            "
            onClick={() =>
              setShowTestScope(
                false
              )
            }
          >

            <div
              className="
                flex
                max-h-[85vh]
                w-full
                max-w-2xl
                flex-col
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-2xl
              "
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-200
                  px-6
                  py-5
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-lg
                      text-blue-600
                    "
                  >
                    ✓
                  </div>

                  <div>

                    <h2
                      className="
                        text-base
                        font-bold
                        text-slate-900
                      "
                    >
                      Suggested Test Scope
                    </h2>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        text-slate-500
                      "
                    >
                      Rule-based validation recommendations
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setShowTestScope(
                      false
                    )
                  }
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    text-lg
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                >
                  ×
                </button>

              </div>


              {/* SUMMARY */}

              <div
                className="
                  border-b
                  border-slate-100
                  bg-slate-50
                  px-6
                  py-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <div>

                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-400
                      "
                    >
                      Modified Component
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-bold
                        text-slate-900
                      "
                    >
                      {
                        changeImpactResult
                          ?.modified
                          ?.name
                      }
                    </p>

                  </div>

                  <div
                    className="text-right"
                  >

                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-400
                      "
                    >
                      Validation Items
                    </p>

                    <p
                      className="
                        mt-1
                        text-lg
                        font-bold
                        text-blue-600
                      "
                    >
                      {testScope.length}
                    </p>

                  </div>

                </div>

              </div>


              {/* TEST LIST */}

              <div
                className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  px-6
                  py-5
                "
              >

                <div
                  className="
                    space-y-3
                  "
                >

                  {testScope.length > 0 ? (

                    testScope.map(
                      (item, index) => (

                        <div
                          key={`
                            ${item.category}-
                            ${item.component?.id || "e2e"}-
                            ${index}
                          `}
                          className="
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-4
                            transition
                            hover:border-blue-200
                            hover:bg-blue-50/30
                          "
                        >

                          <div
                            className="
                              flex
                              items-start
                              gap-3
                            "
                          >

                            {/* NUMBER */}

                            <div
                              className="
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-blue-50
                                text-xs
                                font-bold
                                text-blue-600
                              "
                            >
                              {index + 1}
                            </div>


                            <div
                              className="
                                min-w-0
                                flex-1
                              "
                            >

                              <div
                                className="
                                  flex
                                  items-start
                                  justify-between
                                  gap-3
                                "
                              >

                                <div>

                                  <h3
                                    className="
                                      text-sm
                                      font-semibold
                                      text-slate-900
                                    "
                                  >
                                    {
                                      item.component
                                        ?.name ||
                                      "End-to-End Validation"
                                    }
                                  </h3>

                                  {item.component?.type && (

                                    <span
                                      className="
                                        mt-1
                                        inline-block
                                        rounded-full
                                        bg-slate-100
                                        px-2
                                        py-0.5
                                        text-[9px]
                                        font-semibold
                                        text-slate-500
                                      "
                                    >
                                      {
                                        item.component
                                          .type
                                      }
                                    </span>

                                  )}

                                </div>


                                <span
                                  className="
                                    shrink-0
                                    rounded-full
                                    bg-blue-50
                                    px-2
                                    py-1
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-wide
                                    text-blue-600
                                  "
                                >
                                  {item.category.replaceAll(
                                    "-",
                                    " "
                                  )}
                                </span>

                              </div>


                              <p
                                className="
                                  mt-2
                                  text-[11px]
                                  leading-relaxed
                                  text-slate-500
                                "
                              >
                                {
                                  item.recommendation
                                }
                              </p>

                            </div>

                          </div>

                        </div>

                      )
                    )

                  ) : (

                    <p
                      className="
                        text-sm
                        text-slate-400
                      "
                    >
                      No test recommendations
                      generated.
                    </p>

                  )}

                </div>

              </div>


              {/* FOOTER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-t
                  border-slate-200
                  bg-slate-50
                  px-6
                  py-4
                "
              >

                <p
                  className="
                    max-w-md
                    text-[10px]
                    text-slate-400
                  "
                >
                  Recommendations are inferred from
                  dependency relationships and component
                  types.
                </p>

                <button
                  onClick={() =>
                    setShowTestScope(
                      false
                    )
                  }
                  className="
                    rounded-lg
                    bg-slate-900
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    text-white
                    transition
                    hover:bg-slate-800
                  "
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>

  );
}


export default App;