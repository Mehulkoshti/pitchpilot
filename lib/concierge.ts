/**
 * Deterministic concierge engine.
 *
 * Classifies a fan's free-text question into an intent and answers it directly
 * from stadium data. This is both the offline fallback for the AI concierge and
 * the ground-truth context the AI is prompted with, ensuring answers never
 * hallucinate gates, routes or facilities that do not exist.
 */

import { recommendGate } from './crowd';
import type { GateReading } from './stadium-data';
import { GATES } from './stadium-data';
import { rankTransport } from './sustainability';
import { findNearest } from './wayfinding';
import type { PoiType } from './stadium-data';

/** The categories of question the engine understands. */
export type Intent =
  | 'gate'
  | 'seat'
  | 'restroom'
  | 'food'
  | 'medical'
  | 'exit'
  | 'transport'
  | 'accessibility'
  | 'unknown';

/** A resolved answer with the intent that produced it. */
export interface ConciergeAnswer {
  readonly intent: Intent;
  readonly text: string;
}

/**
 * Keyword sets that map query text to an intent. Order encodes priority. A few
 * common Spanish/French/Portuguese terms are included so the offline fallback
 * still helps the international World Cup crowd when the AI layer is down.
 */
const INTENT_KEYWORDS: ReadonlyArray<{ intent: Intent; words: readonly string[] }> = [
  {
    intent: 'accessibility',
    words: ['wheelchair', 'accessible', 'step-free', 'disabled', 'ramp', 'accesible'],
  },
  {
    intent: 'gate',
    words: [
      'gate',
      'entry',
      'entrance',
      'queue',
      'line',
      'wait',
      'puerta',
      'porte',
      'fila',
    ],
  },
  {
    intent: 'seat',
    words: ['seat', 'block', 'row', 'asiento', 'siège', 'assento'],
  },
  {
    intent: 'restroom',
    words: [
      'restroom',
      'toilet',
      'bathroom',
      'washroom',
      'loo',
      'baño',
      'toilette',
      'banheiro',
    ],
  },
  {
    intent: 'food',
    words: [
      'food',
      'eat',
      'drink',
      'concession',
      'snack',
      'hungry',
      'comida',
      'nourriture',
    ],
  },
  {
    intent: 'medical',
    words: [
      'medical',
      'first aid',
      'first-aid',
      'hurt',
      'sick',
      'nurse',
      'médico',
      'medico',
    ],
  },
  {
    intent: 'exit',
    words: [
      'exit',
      'leave',
      'evacuate',
      'way out',
      'emergency',
      'salida',
      'sortie',
      'saída',
    ],
  },
  {
    intent: 'transport',
    words: [
      'transport',
      'train',
      'metro',
      'bus',
      'car',
      'parking',
      'airport',
      'home',
      'casa',
      'tren',
      'maison',
    ],
  },
];

/** Map a wayfinding intent to the POI type it searches for. */
const INTENT_POI: Partial<Record<Intent, PoiType>> = {
  seat: 'seat',
  restroom: 'restroom',
  food: 'food',
  medical: 'medical',
  exit: 'exit',
};

/** Escape a keyword so it is matched literally inside a regular expression. */
function escapeRegExp(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compile a keyword into a whole-word matcher, tolerating a simple plural.
 *
 * Matching on raw substrings is wrong here: it silently turns "where is my
 * seat?" into a *food* question ("eat" inside "seat") and "which airline?" into
 * a *gate* question ("line" inside "airline"). Anchoring the start of the
 * keyword to a word boundary blocks those, while the optional `s`/`es` suffix
 * keeps natural plurals ("gates", "baños", "buses") matching.
 */
function toMatcher(word: string): RegExp {
  return new RegExp(`\\b${escapeRegExp(word)}(?:es|s)?\\b`);
}

/** Keyword matchers, compiled once at module load rather than per query. */
const INTENT_MATCHERS: ReadonlyArray<{ intent: Intent; patterns: readonly RegExp[] }> =
  INTENT_KEYWORDS.map(({ intent, words }) => ({
    intent,
    patterns: words.map(toMatcher),
  }));

/** Classify free-text into an {@link Intent} using whole-word keyword matching. */
export function classifyIntent(query: string): Intent {
  const normalized = query.toLowerCase();
  for (const { intent, patterns } of INTENT_MATCHERS) {
    if (patterns.some((pattern) => pattern.test(normalized))) return intent;
  }
  return 'unknown';
}

/**
 * Produce a grounded answer to a fan question.
 *
 * @param query the fan's free-text question.
 * @param context runtime context: current gate readings and the fan's location.
 */
export function answerQuery(
  query: string,
  context: {
    readings: readonly GateReading[];
    fromNodeId: string;
    accessibleOnly?: boolean;
  }
): ConciergeAnswer {
  const intent = classifyIntent(query);
  const { readings, fromNodeId, accessibleOnly = false } = context;

  switch (intent) {
    case 'gate': {
      const best = recommendGate(readings, GATES);
      const text = best
        ? `${best.label} has the shortest wait right now — about ${best.waitMinutes} min (${best.level} congestion). Head there for the fastest entry.`
        : 'Live gate data is unavailable, but Gate A (North) has the highest throughput.';
      return { intent, text };
    }
    case 'transport': {
      const [greenest] = rankTransport(8);
      const text = greenest
        ? `The greenest way back is ${greenest.label} (~${greenest.kgCo2e} kg CO₂e, ${greenest.typicalMinutes} min). The rail link is signposted from the South concourse.`
        : 'Rail, shuttle bus and carpool options depart from the South concourse.';
      return { intent, text };
    }
    case 'accessibility': {
      const route = findNearest(fromNodeId, 'restroom', { accessibleOnly: true });
      const text = route
        ? `Step-free routing is available. The nearest accessible restroom is ${route.distanceM} m away via ${route.steps.join(' → ')}.`
        : 'Step-free lifts serve every level; ask any steward for accessible routing assistance.';
      return { intent, text };
    }
    case 'seat': {
      const route = findNearest(fromNodeId, 'seat', { accessibleOnly });
      const text = route
        ? `${route.steps.at(-1)} is ${route.distanceM} m away: ${route.steps.join(' → ')}.`
        : 'Your seat block and row are printed on your ticket — any steward nearby can walk you to it.';
      return { intent, text };
    }
    case 'restroom':
    case 'food':
    case 'medical':
    case 'exit': {
      const poi = INTENT_POI[intent];
      const route = poi ? findNearest(fromNodeId, poi, { accessibleOnly }) : null;
      const text = route
        ? `The nearest ${intent} is ${route.distanceM} m away: ${route.steps.join(' → ')}.`
        : `No ${intent} was found near your location — please ask a nearby steward.`;
      return { intent, text };
    }
    default:
      return {
        intent,
        text: 'I can help with gates and queues, restrooms, food, medical points, exits, transport and step-free routes. What do you need?',
      };
  }
}

/**
 * Build a compact, factual context block for grounding the AI concierge. The
 * model is instructed to answer only from these facts.
 */
export function buildGroundingContext(readings: readonly GateReading[]): string {
  const best = recommendGate(readings, GATES);
  const gateLine = best
    ? `Fastest gate: ${best.label} (~${best.waitMinutes} min, ${best.level}).`
    : 'Gate telemetry unavailable.';
  const gates = GATES.map(
    (gate) => `${gate.label} [${gate.openLanes}/${gate.maxLanes} lanes]`
  ).join('; ');
  return [
    `Venue gates: ${gates}.`,
    gateLine,
    'Facilities: restrooms, food courts, first-aid and step-free lifts on every level.',
    'Transport from South concourse: rail (greenest), shuttle bus, carpool.',
  ].join(' ');
}
