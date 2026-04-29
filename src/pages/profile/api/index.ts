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