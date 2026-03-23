'use client';

import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { useEffect, useState } from 'react';

interface DeferredAnalyticsProps {
  gaId?: string;
  gtmId?: string;
  delayMs?: number;
}

export function DeferredAnalytics({
  gaId,
  gtmId,
  delayMs = 3000,
}: DeferredAnalyticsProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!gaId && !gtmId) {
      return;
    }

    type IdleWindow = Window &
      typeof globalThis & {
        requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

    const currentWindow = window as IdleWindow;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const enableAnalytics = () => setShouldRender(true);

    if (typeof currentWindow.requestIdleCallback === 'function') {
      idleId = currentWindow.requestIdleCallback(enableAnalytics, { timeout: delayMs });
    } else {
      timeoutId = currentWindow.setTimeout(enableAnalytics, delayMs);
    }

    return () => {
      if (idleId !== null && typeof currentWindow.cancelIdleCallback === 'function') {
        currentWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        currentWindow.clearTimeout(timeoutId);
      }
    };
  }, [delayMs, gaId, gtmId]);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </>
  );
}
