export interface LoginRequest {
  phoneNumber: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
}

export interface LoginResponse {
  token: string;
  deviceId?: string;
}