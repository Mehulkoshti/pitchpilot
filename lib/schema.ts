/**
 * Zod schemas for every API boundary.
 *
 * All untrusted input is parsed through these schemas before it reaches any
 * engine, which bounds string lengths and array sizes to prevent abuse and
 * gives the client precise, structured validation errors.
 */

import { z } from 'zod';

/** A single live gate reading accepted from the ops client. */
export const gateReadingSchema = z.object({
  gateId: z.string().min(1).max(32),
  queue: z.number().int().min(0).max(100_000),
  arrivalPerMin: z.number().min(0).max(10_000),
});

/** Body accepted by `POST /api/concierge`. */
export const conciergeRequestSchema = z.object({
  /** The fan's free-text question. */
  message: z.string().trim().min(1, 'Message is required').max(500),
  /** BCP-47-ish language code the fan wants a reply in. */
  language: z.string().min(2).max(8).default('en'),
  /** The fan's current node id for wayfinding context. */
  fromNodeId: z.string().min(1).max(48).default('gate-a'),
  /** Whether to restrict routes to step-free paths. */
  accessibleOnly: z.boolean().default(false),
  /** Optional live gate readings for grounding (bounded to the venue's gates). */
  readings: z.array(gateReadingSchema).max(20).default([]),
});

/** Body accepted by `POST /api/briefing`. */
export const briefingRequestSchema = z.object({
  readings: z.array(gateReadingSchema).min(1).max(20),
  /** Current total occupancy, used for evacuation-readiness context. */
  occupancy: z.number().int().min(0).max(200_000).default(0),
});

/** Inferred request types for use across the app. */
export type ConciergeRequest = z.infer<typeof conciergeRequestSchema>;
export type BriefingRequest = z.infer<typeof briefingRequestSchema>;
