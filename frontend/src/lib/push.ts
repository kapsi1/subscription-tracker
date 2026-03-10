// Helper to convert VAPID key to Uint8Array required by PushManager
export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser.');
  }
  if (!('PushManager' in window)) {
    throw new Error('Push Notifications are not supported in this browser.');
  }

  // Register the service worker
  const registration = await navigator.serviceWorker.register('/sw.js');
  return registration;
}

export async function subscribeToPush(): Promise<PushSubscription> {
  console.log('[Push:subscribe] Start');

  // 1. Ensure permission is granted BEFORE starting the timer
  console.log('[Push:subscribe] Checking permission. Current:', Notification.permission);
  if (Notification.permission !== 'granted') {
    console.log('[Push:subscribe] Requesting permission...');
    const permission = await Notification.requestPermission();
    console.log('[Push:subscribe] Permission result:', permission);
    if (permission !== 'granted') {
      throw new Error(
        'Notification permission denied. Please allow notifications in your browser settings.',
      );
    }
  }

  // 2. Ensure SW is ready
  let registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) {
    console.log('[Push:subscribe] No registration found, registering now...');
    registration = await registerServiceWorker();
  }

  console.log('[Push:subscribe] Waiting for serviceWorker.ready...');
  registration = await navigator.serviceWorker.ready;
  console.log('[Push:subscribe] SW ready state:', registration.active?.state);

  // 3. Check for existing subscription
  console.log('[Push:subscribe] Checking for existing subscription...');
  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) {
    console.log('[Push:subscribe] Found existing subscription, reusing it.');
    return existingSub;
  }

  // 4. Start the network-dependent subscription
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error('VAPID public key not found (check NEXT_PUBLIC_VAPID_PUBLIC_KEY env)');
  }
  console.log('[Push:subscribe] VAPID Key found, length:', vapidPublicKey.length);
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  // Small delay to ensure SW state is stable (helps in Opera/Chrome)
  console.log('[Push:subscribe] Waiting 500ms for SW state stabilization...');
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log('[Push:subscribe] Calling pushManager.subscribe() with 15s timeout...');
  const subscribePromise = (async () => {
    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      return sub;
    } catch (e: unknown) {
      console.error('[Push:subscribe] pushManager.subscribe error details:', e);
      throw e;
    }
  })();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const msg =
        'Push subscription timed out. Browsers (especially Opera) may fail to reach FCM servers if a VPN or Battery Saver is on.';
      reject(new Error(msg));
    }, 15000);
  });

  try {
    const sub = await Promise.race([subscribePromise, timeoutPromise]);
    console.log('[Push:subscribe] SUCCESS:', sub);
    return sub;
  } catch (err: unknown) {
    console.error('[Push:subscribe] FAILED:', err);
    throw err;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    return await subscription.unsubscribe();
  }
  return false;
}
