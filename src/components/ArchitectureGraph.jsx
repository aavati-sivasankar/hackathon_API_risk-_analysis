import { useEffect } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import ComponentNode from "./ComponentNode";

const nodeTypes = {
  component: ComponentNode,
};

/**
 * Controls the React Flow viewport.
 *
 * When a component is selected through search,
 * the graph automatically centers and zooms
 * to that component.
 */
function GraphViewController({ focusNodeId }) {
  const { setCenter, getNode } = useReactFlow();

  useEffect(() => {
    if (!focusNodeId) {
      return;
    }

    const node = getNode(focusNodeId);

    if (!node) {
      return;
    }

    // ComponentNode dimensions:
    // width = 220px
    // height = 100px
    //
    // Move to the approximate center
    // of the node.
    const x = node.position.x + 110;
    const y = node.position.y + 50;

    setCenter(x, y, {
      zoom: 1.2,
      duration: 700,
    });
  }, [focusNodeId, getNode, setCenter]);

  return null;
}

export default function ArchitectureGraph({
  nodes,
  edges,
  onNodeClick,
  focusNodeId,
}) {
  /**
   * Apply visual styles to graph edges.
   *
   * normal:
   *   Regular architecture view.
   *
   * impact:
   *   Failure propagation path.
   *
   * change-impact:
   *   Change impact propagation path.
   *
   * search-impact:
   *   Direct dependency/consumer relationship
   *   of the searched component.
   *
   * normal-muted:
   *   Unrelated edges while analysis mode
   *   is active.
   */
  const styledEdges = edges.map((edge) => {
    const status =
      edge.data?.status || "normal";

    let stroke = "#334155";
    let strokeWidth = 2;
    let opacity = 1;

    /**
     * Failure propagation path
     */
    if (status === "impact") {
      stroke = "#ef4444";
      strokeWidth = 3;
      opacity = 1;
    }

    /**
     * Change impact propagation path
     */
    if (status === "change-impact") {
      stroke = "#2563eb";
      strokeWidth = 3;
      opacity = 1;
    }

    /**
     * Search-related dependency/consumer path
     */
    if (status === "search-impact") {
      stroke = "#2563eb";
      strokeWidth = 3;
      opacity = 1;
    }

    /**
     * Unrelated edges during an analysis mode
     */
    if (status === "normal-muted") {
      stroke = "#94a3b8";
      strokeWidth = 1.5;
      opacity = 0.35;
    }

    return {
      ...edge,

      type: "smoothstep",

      style: {
        stroke,
        strokeWidth,
        opacity,
      },

      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: stroke,
      },
    };
  });

  return (
    <div className="h-full w-full bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        {/* 
          Automatically center and zoom
          when a component is selected
          through search.
        */}
        <GraphViewController
          focusNodeId={focusNodeId}
        />

        {/* Graph background */}
        <Background
          gap={20}
          size={1}
        />

        {/* Zoom / pan controls */}
        <Controls />

        {/* Architecture overview */}
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}