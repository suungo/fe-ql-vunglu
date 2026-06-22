import { BASE_URL } from "@/apis";
import type { AccountRequest, ApiResponse, User } from "../interfaces";

// Tạo biến môi trường
const USERS_URL = '/users';

export interface filterUsers {
  page?: number;
  limit?: number;
  keyword?: string;
  roleCode?: string;
}

// Api đăng ký (Tạo tài khoản quản trị/quản lý)
export const registerApi = async (values: AccountRequest) => {
    const response = await BASE_URL.post(USERS_URL, values);
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

// Api lấy danh sách người dùng đã bị xóa mềm
export const getDeletedUsersApi = async (filter: filterUsers): Promise<ApiResponse<User[]>> => {
    const response = await BASE_URL.get(`${USERS_URL}/deleted-accounts`, { params: filter });
    return response.data;
}

// Api khôi phục người dùng bị xóa mềm
export const restoreUserApi = async (id: number) => {
    const response = await BASE_URL.patch(`${USERS_URL}/${id}/restore`);
    return response.data;
}

// Api tạm ngừng người dùng
export const suspendUserApi = async (id: number) => {
    const response = await BASE_URL.patch(`${USERS_URL}/${id}/suspend`);
    return response.data;
}

// Api khôi phục trạng thái hoạt động người dùng
export const unsuspendUserApi = async (id: number) => {
    const response = await BASE_URL.patch(`${USERS_URL}/${id}/unsuspend`);
    return response.data;
}