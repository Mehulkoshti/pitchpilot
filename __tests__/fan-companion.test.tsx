import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FanCompanion } from '@/components/FanCompanion';

/**
 * The chat log, scoped. Route labels like "Restroom (Upper North)" also appear
 * in the wayfinding panel's steps and origin dropdown, so assertions must be
 * scoped here or they match the wrong panel.
 */
function chatLog(): HTMLElement {
  return screen.getByRole('list', { name: 'Conversation' });
}

/** Capture what the concierge actually posts to the API. */
function mockFetchOk(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          answer: 'Head north.',
          intent: 'restroom',
          source: 'ai',
          language: 'en',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Read the JSON body of the most recent fetch call. */
function lastBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body ?? '{}'));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('FanCompanion — shared fan context', () => {
  it('sends the fan location the wayfinding panel is set to', async () => {
    const fetchMock = mockFetchOk();
    const user = userEvent.setup();
    render(<FanCompanion />);

    await user.selectOptions(screen.getByLabelText(/I'm at/i), 'gate-c');
    await user.click(screen.getByRole('button', { name: /nearest restroom/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastBody(fetchMock).fromNodeId).toBe('gate-c');
  });

  it('carries the step-free preference from the toggle into concierge answers', async () => {
    const fetchMock = mockFetchOk();
    const user = userEvent.setup();
    render(<FanCompanion />);

    await user.click(screen.getByRole('checkbox', { name: /step-free/i }));
    await user.click(screen.getByRole('button', { name: /nearest restroom/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastBody(fetchMock).accessibleOnly).toBe(true);
  });

  it('defaults to the fan sitting in their seat', async () => {
    const fetchMock = mockFetchOk();
    const user = userEvent.setup();
    render(<FanCompanion />);

    await user.click(screen.getByRole('button', { name: /nearest restroom/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastBody(fetchMock).fromNodeId).toBe('seat-2-115');
    expect(lastBody(fetchMock).accessibleOnly).toBe(false);
  });
});

describe('ConciergeChat — offline behaviour', () => {
  it('answers from the on-device engine when the network is gone', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );
    const user = userEvent.setup();
    render(<FanCompanion />);

    await user.click(screen.getByRole('button', { name: /nearest restroom/i }));

    // The local engine routes from the default seat to the Upper North restroom
    // rather than stranding the fan with a network error.
    await waitFor(() =>
      expect(within(chatLog()).getByText(/Restroom \(Upper North\)/)).toBeInTheDocument()
    );
    expect(within(chatLog()).getByText(/48 m away/)).toBeInTheDocument();
    expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
    expect(
      within(chatLog()).getByText(/Answered from stadium data/i)
    ).toBeInTheDocument();
  });

  it('honours step-free routing even in the offline fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );
    const user = userEvent.setup();
    render(<FanCompanion />);

    await user.click(screen.getByRole('checkbox', { name: /step-free/i }));
    await user.click(screen.getByRole('button', { name: /nearest restroom/i }));

    await waitFor(() =>
      expect(within(chatLog()).getByText(/Restroom \(Upper North\)/)).toBeInTheDocument()
    );
    // The step-free answer must never route the fan through the stairs node.
    expect(within(chatLog()).queryByText(/Stairs 1/)).not.toBeInTheDocument();
  });
});
