// Helper to convert VAPID key to Uint8Array required by PushManager
export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

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
  console.log("[Push:subscribe] Start");
  
  // 1. Ensure SW is registered and active
  let registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) {
    console.log("[Push:subscribe] No registration found, registering now...");
    registration = await registerServiceWorker();
  }
  
  console.log("[Push:subscribe] Waiting for serviceWorker.ready...");
  registration = await navigator.serviceWorker.ready;
  console.log("[Push:subscribe] SW Ready state:", registration.active?.state);

  // 2. Check for existing subscription
  console.log("[Push:subscribe] Checking for existing subscription...");
  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) {
    console.log("[Push:subscribe] Found existing subscription, reusing it.");
    return existingSub;
  }
  
  // 3. Permission check
  console.log("[Push:subscribe] Current permission:", Notification.permission);
  if (Notification.permission !== 'granted') {
    console.log("[Push:subscribe] Requesting permission...");
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
  }

  // 4. VAPID Key
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error('VAPID public key not found');
  }
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  // 5. Subscribe with Timeout
  console.log("[Push:subscribe] Calling pushManager.subscribe() with 10s timeout...");
  
  const subscribePromise = registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Push subscription timed out. This can happen if the browser cannot reach push servers.')), 10000);
  });

  try {
    const pushSubscription = await Promise.race([subscribePromise, timeoutPromise]);
    console.log("[Push:subscribe] SUCCESS:", pushSubscription);
    return pushSubscription;
  } catch (err: any) {
    console.error("[Push:subscribe] FAILED:", err);
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
