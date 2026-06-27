import { createServerFn } from "@tanstack/react-start";

/**
 * KNOWLEDGE GRAPH server functions — rebuild the graph, read it for the
 * dashboard, and surface insights (what the system understands + content gaps).
 */

export const rebuildKnowledgeGraphFn = createServerFn({ method: "POST" }).handler(async () => {
  const { rebuildKnowledgeGraph } = await import("./knowledge-graph");
  return rebuildKnowledgeGraph();
});

export const getKnowledgeGraphFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getGraphView } = await import("./knowledge-graph");
  const kg = await import("@/server/db/repos/knowledge-graph");
  const [view, nodes, edges] = await Promise.all([
    getGraphView(60),
    kg.countNodes(),
    kg.countEdges(),
  ]);
  return { ...view, totals: { nodes, edges } };
});

export const getKgInsightsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getGraphGaps, getGraphUnderstanding } = await import("./knowledge-graph");
  const [gaps, understanding] = await Promise.all([getGraphGaps(12), getGraphUnderstanding()]);
  return { gaps, understanding };
});
