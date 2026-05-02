import { BASE_URL } from "@/apis"
import type { ApiResponse, PaginatedResponse } from "@/components/interfaces/response.interface"
import type { CreateHumanResources, HumanResources, UpdateHumanResources } from "../interfaces"

// Tạo biến môi trường 
const HUMANRESOURCE_URL = '/human-resources'

// API thêm nhân sự 
export const createHumanResource = async (value: CreateHumanResources) => {
  const response = await BASE_URL.post<ApiResponse<HumanResources>>(`${HUMANRESOURCE_URL}`, value, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  })
  return response.data
}

export const updateHumanResource = async (value: UpdateHumanResources, id: number) => {
  const response = await BASE_URL.patch<ApiResponse<HumanResources>>(`${HUMANRESOURCE_URL}/${id}`, value, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  })
  return response.data
}


export const getListHumanResource = async (
  keyword: string,
  limit: number,
  page: number,
  status?: string
) => {
  const response = await BASE_URL.get<PaginatedResponse<HumanResources>>(
    `${HUMANRESOURCE_URL}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      params: {
        keyword,
        limit,
        page,
        status,
      },
    }
  );

  return response.data;
};

// API lấy thông tin chi tiết nhân sự
export const getDetailHumanResource = async (id: number) => {
  const response = await BASE_URL.get<ApiResponse<HumanResources>>(`${HUMANRESOURCE_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  })
  return response.data
}

// API xóa nhân sự
export const deteleHumanResource = async (id: number) => {
  const response = await BASE_URL.delete<ApiResponse<unknown>>(`${HUMANRESOURCE_URL}/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  )
  return response.data
}
