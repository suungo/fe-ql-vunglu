import { BASE_URL } from "@/apis";
import type { ApiResponse } from "@/components/interfaces/response.interface";
import type { LoginRequest, LoginResponseData } from "../interfaces";

// Tạo biến môi trường
const LOGIN_URL = '/auth/login';
const LOGOUT_URL = '/auth/logout';

// Api đăng nhập
export const loginApi = async (values: LoginRequest) => {
    const response = await BASE_URL.post<ApiResponse<LoginResponseData>>(LOGIN_URL, values);
    return response.data;
}

export const logoutApi = async (deviceId?: string) => {
    const response = await BASE_URL.post<ApiResponse<unknown>>(LOGOUT_URL, { deviceId });
    return response.data;
}