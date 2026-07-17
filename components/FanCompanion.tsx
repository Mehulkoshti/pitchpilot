'use client';

import { useState } from 'react';
import { ConciergeChat } from '@/components/ConciergeChat';
import { FanContextBar } from '@/components/FanContextBar';
import { RouteFinder } from '@/components/RouteFinder';
import { TransportPanel } from '@/components/TransportPanel';

/** Where a fan is assumed to be before they say otherwise. */
const DEFAULT_ORIGIN = 'seat-2-115';

/**
 * The fan page's interactive shell.
 *
 * It owns the two pieces of context more than one panel needs — the fan's
 * location and their step-free preference — so the concierge answers from the
 * same place the wayfinding panel is routing from. Held separately, the two
 * disagree: a wheelchair user could tick "step-free", ask the chat for the
 * nearest restroom, and be sent down the stairs from a gate they left an hour
 * ago.
 */
export function FanCompanion(): React.JSX.Element {
  const [fromId, setFromId] = useState(DEFAULT_ORIGIN);
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  return (
    <div className="space-y-6">
      <FanContextBar
        fromId={fromId}
        onFromIdChange={setFromId}
        accessibleOnly={accessibleOnly}
        onAccessibleOnlyChange={setAccessibleOnly}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* The chat sticks while the panels beside it scroll: it is the primary
            surface, and the two columns are naturally different heights. */}
        <div className="lg:sticky lg:top-6 lg:col-span-7 lg:self-start">
          <ConciergeChat fromNodeId={fromId} accessibleOnly={accessibleOnly} />
        </div>
        <div className="space-y-6 lg:col-span-5">
          <RouteFinder fromId={fromId} accessibleOnly={accessibleOnly} />
          <TransportPanel />
        </div>
      </div>
    </div>
  );
}
