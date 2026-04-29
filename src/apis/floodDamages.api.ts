import type {
  ApiResponse,
  CreateFloodDamageRequest,
  FloodDamage,
  FloodDamageFilter,
  FloodDamageStats,
  UpdateFloodDamageRequest,
} from "../types/flood-damage.types";
import { BASE_URL } from "./index";

const BASE_PATH = "/flood-damages";

export const floodDamagesApi = {
  // ➕ Tạo thiệt hại mới
  create: async (data: CreateFloodDamageRequest): Promise<FloodDamage> => {
    const response = await BASE_URL.post<ApiResponse<FloodDamage>>(
      BASE_PATH,
      data
    );
    return response.data.data;
  },

  // 📋 Lấy danh sách thiệt hại (có filter, pagination)
  getAll: async (
    filters: FloodDamageFilter = {}
  ): Promise<ApiResponse<FloodDamage[]>> => {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.category) params.append("category", filters.category);
    if (filters.status) params.append("status", filters.status);
    if (filters.reflectionId)
      params.append("reflectionId", filters.reflectionId.toString());
    if (filters.householdId)
      params.append("householdId", filters.householdId.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH;

    const response = await BASE_URL.get<ApiResponse<FloodDamage[]>>(url);
    return response.data;
  },

  // 🔍 Chi tiết thiệt hại
  getById: async (id: number): Promise<FloodDamage> => {
    const response = await BASE_URL.get<ApiResponse<FloodDamage>>(
      `${BASE_PATH}/${id}`
    );
    return response.data.data;
  },

  // ✏️ Cập nhật thiệt hại
  update: async (
    id: number,
    data: UpdateFloodDamageRequest
  ): Promise<FloodDamage> => {
    const response = await BASE_URL.put<ApiResponse<FloodDamage>>(
      `${BASE_PATH}/${id}`,
      data
    );
    return response.data.data;
  },

  // 🗑️ Xóa thiệt hại
  delete: async (id: number): Promise<void> => {
    await BASE_URL.delete(`${BASE_PATH}/${id}`);
  },

  // 📊 Thống kê theo reflection
  getStatsByReflection: async (reflectionId: number): Promise<FloodDamageStats> => {
    const response = await BASE_URL.get<ApiResponse<FloodDamageStats>>(
      `${BASE_PATH}/stats/by-reflection/${reflectionId}`
    );
    return response.data.data;
  },
};
