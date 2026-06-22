import { BASE_URL } from "@/apis";
import type { ApiResponse } from "@/components/interfaces/response.interface";
import type {
    FloodDamage,
    FloodDamageFilter,
    FloodDamageStats,
    CreateFloodDamageRequest,
    UpdateFloodDamageRequest
} from "@/types/flood-damage.types";

const FLOOD_DAMAGE_URL = "/flood-damages";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

// ➕ Tạo thiệt hại mới
export const createFloodDamage = async (data: CreateFloodDamageRequest) => {
  const response = await BASE_URL.post<ApiResponse<FloodDamage>>(
    `${FLOOD_DAMAGE_URL}`,
    data,
    { headers: authHeader() }
  );
  return response.data;
};

// ✏️ Cập nhật thiệt hại
export const updateFloodDamage = async (
  id: number,
  data: UpdateFloodDamageRequest
) => {
  const response = await BASE_URL.put<ApiResponse<FloodDamage>>(
    `${FLOOD_DAMAGE_URL}/${id}`,
    data,
    { headers: authHeader() }
  );
  return response.data;
};

// 🔄 Cập nhật trạng thái (duyệt / từ chối)
export const updateFloodDamageStatus = async (id: number, status: "APPROVED" | "REJECTED") => {
  const response = await BASE_URL.put<ApiResponse<FloodDamage>>(
    `${FLOOD_DAMAGE_URL}/status/${id}`,
    { status },
    { headers: authHeader() }
  );
  return response.data;
};

// 🗑️ Xóa thiệt hại
export const deleteFloodDamage = async (id: number) => {
  const response = await BASE_URL.delete<ApiResponse<void>>(
    `${FLOOD_DAMAGE_URL}/${id}`,
    { headers: authHeader() }
  );
  return response.data;
};

// 📋 Lấy danh sách thiệt hại
export const getListFloodDamage = async (filters: FloodDamageFilter = {}) => {
  const response = await BASE_URL.get<ApiResponse<FloodDamage[]>>(
    `${FLOOD_DAMAGE_URL}`,
    { headers: authHeader(), params: filters }
  );
  return response.data;
};

// 🔍 Chi tiết thiệt hại
export const getDetailFloodDamage = async (id: number) => {
  const response = await BASE_URL.get<ApiResponse<FloodDamage>>(
    `${FLOOD_DAMAGE_URL}/${id}`,
    { headers: authHeader() }
  );
  return response.data;
};

// 📊 Thống kê theo reflection
export const getStatsByReflection = async (reflectionId: number) => {
  const response = await BASE_URL.get<ApiResponse<FloodDamageStats>>(
    `${FLOOD_DAMAGE_URL}/stats/by-reflection/${reflectionId}`,
    { headers: authHeader() }
  );
  return response.data;
};
