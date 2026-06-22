import { BASE_URL } from "@/apis";
import type { ChangePasswordRequest, UpdateProfile } from "../interfaces";

// Tạo biến môi trường
const API_URL = "users/me";
const CHANGE_URL = '/auth/change-password'

// Api thấy thông tin cá nhân
export const getProfileApi = async () => {
  const response = await BASE_URL.get(`/${API_URL}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

// Api cập nhật thông tin cá nhân 
export const updateProfileApi = async (data: UpdateProfile) => {
  const response = await BASE_URL.patch(`/${API_URL}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};


// api thay đổi mật khẩu

export const changePassword = async (data: ChangePasswordRequest) => {
  const response  = await BASE_URL.post(`${CHANGE_URL}`, data , {
    headers: {
      Authorization:`Bearer ${localStorage.getItem("accessToken")}`
    }
  })

  return response.data
}

// Lấy danh sách thiết bị đang hoạt động (lịch sử đăng nhập)
export const getUserDevicesApi = async () => {
  const response = await BASE_URL.get("/auth/devices", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

// Đăng xuất thiết bị cụ thể
export const deactivateDeviceApi = async (deviceId: string) => {
  const response = await BASE_URL.post("/auth/logout", { deviceId }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

// Lấy lịch sử biến động điểm uy tín
export const getReputationHistoryApi = async () => {
  const response = await BASE_URL.get("/users/reputation-history", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};