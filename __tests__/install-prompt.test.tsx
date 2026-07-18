import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPrompt } from '@/components/InstallPrompt';

/** A synthetic beforeinstallprompt with a spyable prompt(). */
function installEvent(): Event & { prompt: ReturnType<typeof vi.fn> } {
  return Object.assign(new Event('beforeinstallprompt'), {
    prompt: vi.fn(async () => undefined),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('InstallPrompt', () => {
  it('renders nothing until the browser offers an install', () => {
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('slides in with an Install button once the prompt fires', async () => {
    render(<InstallPrompt />);
    window.dispatchEvent(installEvent());
    expect(await screen.findByRole('button', { name: /^install$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('complementary', { name: /install pitchpilot/i })
    ).toBeInTheDocument();
  });

  it('fires the native prompt when Install is clicked', async () => {
    render(<InstallPrompt />);
    const event = installEvent();
    window.dispatchEvent(event);
    await userEvent.click(await screen.findByRole('button', { name: /^install$/i }));
    await waitFor(() => expect(event.prompt).toHaveBeenCalledOnce());
  });

  it('dismissing hides it and remembers the choice', async () => {
    const { unmount } = render(<InstallPrompt />);
    window.dispatchEvent(installEvent());
    await screen.findByRole('button', { name: /^install$/i });

    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(localStorage.getItem('pitchpilot:install-dismissed')).toBe('1');

    // A fresh mount must not resurface it, even if the browser offers again.
    unmount();
    render(<InstallPrompt />);
    window.dispatchEvent(installEvent());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
