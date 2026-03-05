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
  let registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) {
    registration = await registerServiceWorker();
  }
  
  registration = await navigator.serviceWorker.ready;

  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) {
    return existingSub;
  }
  
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error('VAPID public key not found');
  }
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  const subscribePromise = registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Push subscription timed out. This can happen if the browser cannot reach push servers.')), 10000);
  });

  return await Promise.race([subscribePromise, timeoutPromise]);
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    return await subscription.unsubscribe();
  }
  return false;
}
