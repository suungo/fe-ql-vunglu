import type { ProfileStatus } from "../enum";

export interface Profile {
  userId: number; // ID người dùng
  fullName: string; // Họ và tên
  phoneNumber: string; // Số điện thoại
  email: string; // Email
  gender: string; // Giới tính
  dateBirth: string; // Ngày sinh
  address: string; // Địa chỉ
  addressGroup: string; // Nhóm địa chỉ
  role: string; // Vị trí
  reportsCount: number; // Số lượng báo cáo
  priorityLevel: number; // Mức độ ưu tiên
  status: ProfileStatus; // Trạng thái
}


export interface UpdateProfile {
  userId: number; // ID người dùng
  fullName: string; // Họ và tên
  phoneNumber: string; // Số điện thoại
  email: string; // Email
  gender: string; // Giới tính
  dateBirth: string; // Ngày sinh
  address: string; // Địa chỉ
  status: ProfileStatus; // Trạng thái
}

export interface ChangePasswordRequest {
  // phoneNumber: string; // Số điện thoại
  oldPassword: string; // Mật khẩu cũ
  newPassword: string; // Mật khẩu mới
}

export interface UserDevice {
  id: number;
  deviceId: string;
  userId: number;
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActiveAt?: string;
  createdAt?: string;
}