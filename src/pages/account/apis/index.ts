import { BASE_URL } from "@/apis";
import type { AccountRequest, ApiResponse, User } from "../interfaces";

// Tạo biến môi trường
const REGISTER_URL = '/auth/register';
const USERS_URL = '/users';

export interface filterUsers {
  page?: number;
  limit?: number;
  keyword?: string;
}

// Api đăng ký
export const registerApi = async (values: AccountRequest) => {
    const response = await BASE_URL.post(REGISTER_URL, values);
    return response.data;
}

// Api lấy danh sách người dùng
export const getUsersApi = async (filter: filterUsers): Promise<ApiResponse<User[]>> => {
    const response = await BASE_URL.get(USERS_URL, { params: filter });
    return response.data;
}

// Api xóa người dùng
export const deleteUserApi = async (id: number) => {
    const response = await BASE_URL.delete(`${USERS_URL}/${id}`);
    return response.data;
}