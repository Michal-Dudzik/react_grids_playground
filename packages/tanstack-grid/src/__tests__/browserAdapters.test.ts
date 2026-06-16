import { describe, expect, it, vi } from 'vitest';
import {
  copyText,
  createHttpColumnPreferencesAdapter,
  createLocalStorageGridStateAdapter,
} from '../adapters/browser';

describe('browser adapters', () => {
  it('stores state under the configured localStorage key', () => {
    const storage = window.localStorage;
    storage.clear();

    const adapter = createLocalStorageGridStateAdapter({
      key: 'grid-state-test',
      fallback: { visible: true },
    });

    expect(adapter.read()).toEqual({ visible: true });
    adapter.write({ visible: false });
    expect(adapter.read()).toEqual({ visible: false });
  });

  it('uses a consumer-provided endpoint and request function for column preferences', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    }));
    const adapter = createHttpColumnPreferencesAdapter({
      endpoint: ({ gridId }) => `/columns/${gridId}`,
      request: request as any,
    });

    await expect(adapter.save({ gridId: 'orders', payload: [{ field: 'id' }] })).resolves.toEqual({ ok: true });
    expect(request).toHaveBeenCalledWith('/columns/orders', expect.objectContaining({
      method: 'PUT',
    }));
  });

  it('warns when using the legacy copy fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const execCommand = vi.fn().mockReturnValue(true);
    const clipboard = navigator.clipboard;

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    try {
      copyText('legacy copy');
      expect(warn).toHaveBeenCalledWith(
        '[tanstack-grid] navigator.clipboard is unavailable; using legacy copy fallback (document.execCommand).',
      );
      expect(execCommand).toHaveBeenCalledWith('copy');
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: clipboard,
      });
      Reflect.deleteProperty(document, 'execCommand');
      warn.mockRestore();
    }
  });
});
