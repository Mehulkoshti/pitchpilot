import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPrompt } from '@/components/InstallPrompt';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('InstallPrompt', () => {
  it('always explains the install benefits', () => {
    render(<InstallPrompt />);
    expect(
      screen.getByRole('heading', { name: /take pitchpilot with you/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/works offline/i)).toBeInTheDocument();
    expect(screen.getByText(/opens instantly/i)).toBeInTheDocument();
    expect(screen.getByText(/no app store/i)).toBeInTheDocument();
  });

  it('falls back to a browser-menu hint when no install prompt is available', () => {
    render(<InstallPrompt />);
    expect(screen.getByText(/install from your browser menu/i)).toBeInTheDocument();
  });

  it('shows an Install button and fires the native prompt when offered', async () => {
    const promptFn = vi.fn(async () => undefined);
    const evt = Object.assign(new Event('beforeinstallprompt'), {
      prompt: promptFn,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });

    render(<InstallPrompt />);
    // The browser fires the event after load; dispatch it.
    window.dispatchEvent(evt);

    const button = await screen.findByRole('button', { name: /install app/i });
    await userEvent.click(button);
    await waitFor(() => expect(promptFn).toHaveBeenCalledOnce());
  });
});
