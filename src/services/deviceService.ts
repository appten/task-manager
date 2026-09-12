export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastActiveAt: string;
  isCurrentDevice?: boolean;
}

const DEVICE_ID_KEY = 'ten_my_id_device_id';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_render_device';
  try {
    let devId = localStorage.getItem(DEVICE_ID_KEY);
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch {
    return 'dev_fallback_' + Date.now();
  }
}

export function getCurrentDeviceInfo(): DeviceInfo {
  const id = getOrCreateDeviceId();

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      id,
      name: 'Perangkat Web',
      type: 'desktop',
      browser: 'Browser',
      os: 'Web',
      lastActiveAt: new Date().toISOString(),
      isCurrentDevice: true,
    };
  }

  const ua = navigator.userAgent;

  // 1. Deteksi OS
  let os = 'Sistem';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipod/i.test(ua)) os = 'iOS (iPhone)';
  else if (/ipad/i.test(ua)) os = 'iPadOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'ChromeOS';

  // 2. Deteksi Browser
  let browser = 'Peramban Web';
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua)) browser = 'Apple Safari';
  else if (/opera|opr\//i.test(ua)) browser = 'Opera';

  // 3. Deteksi Tipe Perangkat
  let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/tablet|ipad/i.test(ua)) {
    type = 'tablet';
  } else if (/mobi|android|iphone/i.test(ua)) {
    type = 'mobile';
  }

  const name = `${browser} di ${os}`;

  return {
    id,
    name,
    type,
    browser,
    os,
    lastActiveAt: new Date().toISOString(),
    isCurrentDevice: true,
  };
}
