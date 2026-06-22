import { BASE_URL } from '@/apis';

/**
 * Chuyển đổi khóa VAPID Public từ base64 sang Uint8Array
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Đăng ký Service Worker và thiết lập Web Push
 */
export async function setupWebPushNotifications(deviceId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('⚠️ Trình duyệt không hỗ trợ Service Worker hoặc Push Notifications.');
    return;
  }

  try {
    // 1. Hỏi quyền thông báo
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Quyền nhận thông báo bị từ chối.');
      return;
    }

    // 2. Đăng ký Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered successfully:', registration);

    // 3. Lấy VAPID public key từ backend
    const res = await BASE_URL.get<{ data: { publicKey: string } }>('/notifications/vapid-public-key');
    const vapidPublicKey = res.data.data.publicKey;

    if (!vapidPublicKey) {
      console.error('❌ Không tìm thấy VAPID public key từ backend.');
      return;
    }

    // 4. Đăng ký/Lấy subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log('✅ Tạo mới Web Push subscription thành công.');
    } else {
      console.log('🔄 Đã tồn tại Web Push subscription.');
    }

    // 5. Đồng bộ subscription lên backend
    await BASE_URL.post('/auth/subscribe-push', {
      deviceId,
      webPushSub: subscription,
    });
    console.log('✅ Đã đồng bộ subscription lên backend.');
  } catch (error) {
    console.error('❌ Lỗi thiết lập Web Push Notifications:', error);
  }
}
