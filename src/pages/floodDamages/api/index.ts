import { BASE_URL } from "@/apis";
import type { ApiResponse } from "@/components/interfaces/response.interface";
import type {
  FloodDamage,
  FloodDamageFilter,
  FloodDamageStats,
  UpdateFloodDamageRequest
} from "@/types/flood-damage.types";

const FLOOD_DAMAGE_URL = "/flood-damages";

// ✏️ Cập nhật thiệt hại
export const updateFloodDamage = async (
  id: number,
  data: UpdateFloodDamageRequest
) => {
  const response = await BASE_URL.put<ApiResponse<FloodDamage>>(
    `${FLOOD_DAMAGE_URL}/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );
  return response.data;
};

// 🗑️ Xóa thiệt hại
export const deleteFloodDamage = async (id: number) => {
  const response = await BASE_URL.delete<ApiResponse>(
    `${FLOOD_DAMAGE_URL}/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );
  return response.data;
};

// 📋 Lấy danh sách thiệt hại
export const getListFloodDamage = async (filters: FloodDamageFilter = {}) => {
  const response = await BASE_URL.get<ApiResponse<FloodDamage[]>>(
    `${FLOOD_DAMAGE_URL}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      params: filters,
    }
  );
  return response.data;
};

// 🔍 Chi tiết thiệt hại
export const getDetailFloodDamage = async (id: number) => {
  const response = await BASE_URL.get<ApiResponse<FloodDamage>>(
    `${FLOOD_DAMAGE_URL}/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );
  return response.data;
};

// 📊 Thống kê theo reflection
export const getStatsByReflection = async (reflectionId: number) => {
  const response = await BASE_URL.get<ApiResponse<FloodDamageStats>>(
    `${FLOOD_DAMAGE_URL}/stats/by-reflection/${reflectionId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );
  return response.data;
};
