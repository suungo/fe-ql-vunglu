import { BASE_URL } from "@/apis";
import type { ApiResponse, PaginatedResponse } from "@/components/interfaces/response.interface";
import type { UpdateVerification, Verification } from "../interfaces";

const PATH = "verifications";

export const getVerificationsApi = async (params: { page?: number; limit?: number; status?: string }) => {
  const response = await BASE_URL.get<PaginatedResponse<Verification>>(`/${PATH}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    params,
  });
  return response.data;
};

export const updateVerificationApi = async (id: number, data: UpdateVerification) => {
  const response = await BASE_URL.patch<ApiResponse<Verification>>(`/${PATH}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

export const getVerificationDetailApi = async (id: number) => {
  const response = await BASE_URL.get<ApiResponse<Verification>>(`/${PATH}/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

export const deleteVerificationApi = async (id: number) => {
  const response = await BASE_URL.delete<ApiResponse<Verification>>(`/${PATH}/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};
