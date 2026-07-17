'use client';

import { useState } from 'react';
import { ConciergeChat } from '@/components/ConciergeChat';
import { RouteFinder } from '@/components/RouteFinder';
import { TransportPanel } from '@/components/TransportPanel';

/** Where a fan is assumed to be before they say otherwise. */
const DEFAULT_ORIGIN = 'seat-2-115';

/**
 * The fan page's interactive shell.
 *
 * It exists to own the two pieces of context that more than one panel needs —
 * the fan's location and their step-free preference — so the concierge answers
 * from the same place the wayfinding panel is routing from. Held separately,
 * the two disagree: a wheelchair user could tick "step-free", ask the chat for
 * the nearest restroom, and be sent down the stairs from a gate they left an
 * hour ago.
 */
export function FanCompanion(): React.JSX.Element {
  const [fromId, setFromId] = useState(DEFAULT_ORIGIN);
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="lg:row-span-2">
        <ConciergeChat fromNodeId={fromId} accessibleOnly={accessibleOnly} />
      </div>
      <RouteFinder
        fromId={fromId}
        onFromIdChange={setFromId}
        accessibleOnly={accessibleOnly}
        onAccessibleOnlyChange={setAccessibleOnly}
      />
      <TransportPanel />
    </div>
  );
}
