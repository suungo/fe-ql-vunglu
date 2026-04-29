// Utility để quản lý deviceId
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'device_id';
const DEVICE_NAME_KEY = 'device_name';
const DEVICE_TYPE_KEY = 'device_type';

/**
 * Lấy hoặc tạo deviceId mới
 * Nếu đã có trong localStorage thì dùng lại, không thì tạo mới
 */
export const getOrCreateDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('🔧 Generated new deviceId:', deviceId);
  }
  
  return deviceId;
};

/**
 * Lấy deviceId hiện tại (không tạo mới)
 */
export const getDeviceId = (): string | null => {
  return localStorage.getItem(DEVICE_ID_KEY);
};

/**
 * Xóa deviceId khi logout
 */
export const clearDeviceId = (): void => {
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_NAME_KEY);
  localStorage.removeItem(DEVICE_TYPE_KEY);
  console.log('🗑️ DeviceId cleared');
};

/**
 * Lưu thông tin thiết bị
 */
export const saveDeviceInfo = (deviceId: string, deviceName?: string, deviceType?: string): void => {
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  if (deviceName) {
    localStorage.setItem(DEVICE_NAME_KEY, deviceName);
  }
  if (deviceType) {
    localStorage.setItem(DEVICE_TYPE_KEY, deviceType);
  }
};

/**
 * Lấy thông tin thiết bị đầy đủ
 */
export const getDeviceInfo = () => {
  return {
    deviceId: localStorage.getItem(DEVICE_ID_KEY),
    deviceName: localStorage.getItem(DEVICE_NAME_KEY) || getDefaultDeviceName(),
    deviceType: localStorage.getItem(DEVICE_TYPE_KEY) || getDeviceType(),
  };
};

/**
 * Lấy tên thiết bị mặc định dựa trên user agent
 */
const getDefaultDeviceName = (): string => {
  const ua = navigator.userAgent;
  
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux PC';
  
  return 'Unknown Device';
};

/**
 * Xác định loại thiết bị
 */
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
    return 'mobile';
  }
  
  return 'web';
};
