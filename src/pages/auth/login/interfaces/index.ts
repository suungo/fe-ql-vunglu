export interface LoginRequest {
  phoneNumber: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  expoPushToken?: string;
  webPushSub?: any;
}

export interface LoginResponseData {
  accessToken: string;
  user: {
    id: number;
    fullName: string;
    phoneNumber: string;
    role: {
      roleCode: string;
      roleName: string;
    };
  };
  deviceId?: string;
}

export interface LoginResponse {
  token: string;
  deviceId?: string;
}