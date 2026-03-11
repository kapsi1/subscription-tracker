import axios, { type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We need to test the interceptor behavior, so we import the configured instance
// and use vitest to mock localStorage + window events.

describe('api interceptors', () => {
  let api: typeof import('./api').default;

  beforeEach(async () => {
    // Reset modules so each test gets a fresh axios instance
    vi.resetModules();

    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
    });

    // Import fresh module
    const mod = await import('./api');
    api = mod.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should attach Authorization header when token exists', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('test-token');

    // Intercept the request config to verify header was set
    const config = await api.interceptors.request.handlers?.[0].fulfilled?.({
      headers: new axios.AxiosHeaders(),
    } as unknown as InternalAxiosRequestConfig);

    expect(config?.headers.Authorization).toBe('Bearer test-token');
  });

  it('should not attach Authorization header when no token', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const config = await api.interceptors.request.handlers?.[0].fulfilled?.({
      headers: new axios.AxiosHeaders(),
    } as unknown as InternalAxiosRequestConfig);

    expect(config?.headers.Authorization).toBeUndefined();
  });

  it('should clear token and dispatch event on 401', async () => {
    const dispatchSpy = vi.fn();
    vi.stubGlobal('window', {
      ...globalThis.window,
      dispatchEvent: dispatchSpy,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    // Stub localStorage on window context
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    const error = {
      config: { _retry: false },
      response: { status: 401 },
    };

    // The response error handler should reject
    await expect(api.interceptors.response.handlers?.[0].rejected?.(error)).rejects.toBeDefined();

    expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
