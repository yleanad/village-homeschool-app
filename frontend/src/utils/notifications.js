import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

// Check if notifications are enabled
export function isNotificationEnabled() {
  return Notification.permission === 'granted';
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    console.log('Push notifications not supported');
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Subscribe to push notifications
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }
  
  // Request permission first
  const permission = await requestNotificationPermission();
  if (!permission) {
    throw new Error('Notification permission denied');
  }
  
  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;
  
  // Check if already subscribed
  let subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
    // Get VAPID key from server if not in env
    let vapidKey = VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      try {
        const response = await axios.get(`${API_URL}/api/notifications/vapid-key`);
        vapidKey = response.data.publicKey;
      } catch (error) {
        console.error('Failed to get VAPID key:', error);
        throw new Error('Failed to get VAPID key');
      }
    }
    
    // Subscribe to push
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });
  }
  
  // Send subscription to server
  const subscriptionData = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
      auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
    }
  };
  
  await axios.post(`${API_URL}/api/notifications/subscribe`, subscriptionData, {
    withCredentials: true
  });
  
  return subscription;
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    // Notify server
    try {
      await axios.delete(`${API_URL}/api/notifications/unsubscribe`, {
        data: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
          }
        },
        withCredentials: true
      });
    } catch (error) {
      console.error('Failed to notify server of unsubscription:', error);
    }
    
    // Unsubscribe locally
    await subscription.unsubscribe();
  }
  
  return true;
}

// Get notification preferences
export async function getNotificationPreferences() {
  try {
    const response = await axios.get(`${API_URL}/api/notifications/preferences`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return {
      preferences: {
        messages: true,
        events: true,
        meetup_requests: true,
        group_updates: true
      },
      push_enabled: false
    };
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences) {
  const response = await axios.put(`${API_URL}/api/notifications/preferences`, preferences, {
    withCredentials: true
  });
  return response.data;
}

// Send test notification
export async function sendTestNotification() {
  const response = await axios.post(`${API_URL}/api/notifications/test`, {}, {
    withCredentials: true
  });
  return response.data;
}

// Check push subscription status
export async function getPushSubscriptionStatus() {
  if (!isPushSupported()) {
    return { supported: false, subscribed: false, permission: 'unsupported' };
  }
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  return {
    supported: true,
    subscribed: !!subscription,
    permission: Notification.permission
  };
}
