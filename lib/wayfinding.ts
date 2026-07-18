/**
 * Indoor wayfinding engine.
 *
 * Computes shortest walking routes across the stadium navigation graph using
 * Dijkstra's algorithm. Supports an accessibility mode that excludes
 * stairs-only edges and inaccessible nodes, so wheelchair users receive a
 * guaranteed step-free path. Pure and deterministic.
 */

import { round } from './math';
import { EDGES, NODES, findNode } from './stadium-data';
import type { PoiType, StadiumEdge, StadiumNode } from './stadium-data';

/** Options controlling how a route is computed. */
export interface RouteOptions {
  /** When true, exclude stairs-only edges and inaccessible nodes. */
  readonly accessibleOnly?: boolean;
}

/** A computed route between two nodes. */
export interface Route {
  /** Ordered node ids from origin to destination (inclusive). */
  readonly path: readonly string[];
  /** Ordered human-readable step labels for turn-by-turn display. */
  readonly steps: readonly string[];
  /** Total walking distance in metres. */
  readonly distanceM: number;
  /** Whether every edge on the route is step-free. */
  readonly accessible: boolean;
}

/** Adjacency entry: a reachable neighbour and the edge used to reach it. */
interface Neighbour {
  readonly to: string;
  readonly edge: StadiumEdge;
}

/** The predecessor of a node on the best-known route, and the edge walked. */
interface Step {
  readonly from: string;
  readonly edge: StadiumEdge;
}

/**
 * Build an adjacency map from the (undirected) edge list, optionally dropping
 * stairs-only edges and edges touching inaccessible nodes.
 */
function buildGraph(
  nodes: readonly StadiumNode[],
  edges: readonly StadiumEdge[],
  accessibleOnly: boolean
): Map<string, Neighbour[]> {
  const accessibleNodeIds = new Set(
    nodes.filter((node) => !accessibleOnly || node.accessible).map((node) => node.id)
  );
  const graph = new Map<string, Neighbour[]>();
  const link = (from: string, to: string, edge: StadiumEdge): void => {
    if (!accessibleNodeIds.has(from) || !accessibleNodeIds.has(to)) return;
    const list = graph.get(from) ?? [];
    list.push({ to, edge });
    graph.set(from, list);
  };
  for (const edge of edges) {
    if (accessibleOnly && edge.stairsOnly) continue;
    link(edge.from, edge.to, edge);
    link(edge.to, edge.from, edge);
  }
  return graph;
}

/** Only two graphs are possible (accessible or not), so build each once. */
const GRAPH_CACHE = new Map<boolean, Map<string, Neighbour[]>>();

function graphFor(accessibleOnly: boolean): Map<string, Neighbour[]> {
  let graph = GRAPH_CACHE.get(accessibleOnly);
  if (graph === undefined) {
    graph = buildGraph(NODES, EDGES, accessibleOnly);
    GRAPH_CACHE.set(accessibleOnly, graph);
  }
  return graph;
}

/** The result of one shortest-path sweep from a single source. */
interface Sweep {
  readonly distance: Map<string, number>;
  readonly previous: Map<string, Step>;
}

/**
 * Dijkstra from one source to every reachable node in a single pass, so both
 * {@link findRoute} and {@link findNearest} reuse one sweep. O(V²) selection is
 * fine for a graph this small.
 */
function sweepFrom(fromId: string, accessibleOnly: boolean): Sweep {
  const graph = graphFor(accessibleOnly);
  const distance = new Map<string, number>([[fromId, 0]]);
  const previous = new Map<string, Step>();
  const visited = new Set<string>();

  while (visited.size < NODES.length) {
    const current = closestUnvisited(distance, visited);
    if (current === null) break;
    visited.add(current);
    for (const { to, edge } of graph.get(current) ?? []) {
      if (visited.has(to)) continue;
      const candidate = (distance.get(current) ?? Infinity) + edge.distanceM;
      if (candidate < (distance.get(to) ?? Infinity)) {
        distance.set(to, candidate);
        previous.set(to, { from: current, edge });
      }
    }
  }
  return { distance, previous };
}

/** Assemble a {@link Route} to `toId` from a completed sweep, or `null`. */
function routeTo(sweep: Sweep, fromId: string, toId: string): Route | null {
  if (!sweep.distance.has(toId)) return null;
  const { path, edges } = reconstructPath(sweep.previous, fromId, toId);
  return {
    path,
    steps: path.map(labelOf),
    distanceM: round(sweep.distance.get(toId) ?? 0),
    accessible: isStepFree(path, edges),
  };
}

/**
 * Find the shortest route between two node ids.
 *
 * @returns a {@link Route}, or `null` when either endpoint is unknown or no
 *   path exists under the requested options.
 */
export function findRoute(
  fromId: string,
  toId: string,
  options: RouteOptions = {}
): Route | null {
  if (!findNode(fromId) || !findNode(toId)) return null;
  if (fromId === toId) {
    return {
      path: [fromId],
      steps: [labelOf(fromId)],
      distanceM: 0,
      accessible: findNode(fromId)?.accessible ?? false,
    };
  }

  const accessibleOnly = options.accessibleOnly ?? false;
  return routeTo(sweepFrom(fromId, accessibleOnly), fromId, toId);
}

/**
 * Whether a route is genuinely step-free — no stairs, every node accessible —
 * derived from the route itself, not the caller's request flag.
 */
function isStepFree(path: readonly string[], edges: readonly StadiumEdge[]): boolean {
  return (
    edges.every((edge) => !edge.stairsOnly) &&
    path.every((id) => findNode(id)?.accessible ?? false)
  );
}

/**
 * Route a fan to the nearest point of interest of a given type (e.g. the
 * closest restroom or exit) from their current node.
 *
 * @returns the best {@link Route}, or `null` when no reachable POI of that type.
 */
export function findNearest(
  fromId: string,
  type: PoiType,
  options: RouteOptions = {}
): Route | null {
  if (!findNode(fromId)) return null;

  const sweep = sweepFrom(fromId, options.accessibleOnly ?? false);
  let bestId: string | null = null;
  let bestDist = Infinity;
  for (const node of NODES) {
    if (node.type !== type || node.id === fromId) continue;
    const dist = sweep.distance.get(node.id);
    if (dist !== undefined && dist < bestDist) {
      bestDist = dist;
      bestId = node.id;
    }
  }
  return bestId === null ? null : routeTo(sweep, fromId, bestId);
}

/** Return the unvisited node with the smallest tentative distance. */
function closestUnvisited(
  distance: Map<string, number>,
  visited: Set<string>
): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [id, dist] of distance) {
    if (visited.has(id) || dist >= bestDist) continue;
    best = id;
    bestDist = dist;
  }
  return best;
}

/**
 * Walk the `previous` map backwards to build the ordered path, collecting the
 * edges walked along the way so the caller can inspect the route's properties.
 */
function reconstructPath(
  previous: Map<string, Step>,
  fromId: string,
  toId: string
): { path: string[]; edges: StadiumEdge[] } {
  const path: string[] = [toId];
  const edges: StadiumEdge[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    const step = previous.get(cursor);
    if (step === undefined) break;
    path.unshift(step.from);
    edges.unshift(step.edge);
    cursor = step.from;
  }
  return { path, edges };
}

/** Resolve a node id to its display label, falling back to the id. */
function labelOf(id: string): string {
  return findNode(id)?.label ?? id;
}
