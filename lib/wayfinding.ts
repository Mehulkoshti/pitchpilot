/**
 * Indoor wayfinding engine.
 *
 * Computes shortest walking routes across the stadium navigation graph using
 * Dijkstra's algorithm. Supports an accessibility mode that excludes
 * stairs-only edges and inaccessible nodes, so wheelchair users receive a
 * guaranteed step-free path. Pure and deterministic.
 */

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
    return { path: [fromId], steps: [labelOf(fromId)], distanceM: 0, accessible: true };
  }

  const accessibleOnly = options.accessibleOnly ?? false;
  const graph = buildGraph(NODES, EDGES, accessibleOnly);
  const distance = new Map<string, number>();
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  distance.set(fromId, 0);

  // Simple O(V^2) selection is ideal here: the venue graph is small and this
  // keeps the implementation dependency-free and easy to verify.
  while (visited.size < NODES.length) {
    const current = closestUnvisited(distance, visited);
    if (current === null) break;
    if (current === toId) break;
    visited.add(current);
    for (const { to, edge } of graph.get(current) ?? []) {
      if (visited.has(to)) continue;
      const candidate = (distance.get(current) ?? Infinity) + edge.distanceM;
      if (candidate < (distance.get(to) ?? Infinity)) {
        distance.set(to, candidate);
        previous.set(to, current);
      }
    }
  }

  if (!distance.has(toId)) return null;
  const path = reconstructPath(previous, fromId, toId);
  return {
    path,
    steps: path.map(labelOf),
    distanceM: round1(distance.get(toId) ?? 0),
    accessible: accessibleOnly,
  };
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
  let best: Route | null = null;
  for (const node of NODES) {
    if (node.type !== type || node.id === fromId) continue;
    const route = findRoute(fromId, node.id, options);
    if (route && (best === null || route.distanceM < best.distanceM)) best = route;
  }
  return best;
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

/** Walk the `previous` map backwards to build the ordered path. */
function reconstructPath(
  previous: Map<string, string>,
  fromId: string,
  toId: string
): string[] {
  const path: string[] = [toId];
  let cursor = toId;
  while (cursor !== fromId) {
    const prev = previous.get(cursor);
    if (prev === undefined) break;
    path.unshift(prev);
    cursor = prev;
  }
  return path;
}

/** Resolve a node id to its display label, falling back to the id. */
function labelOf(id: string): string {
  return findNode(id)?.label ?? id;
}

/** Round to one decimal place. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
