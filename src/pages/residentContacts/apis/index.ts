import { BASE_URL } from "@/apis";
import type { ApiResponse, PaginatedResponse } from "@/components/interfaces/response.interface";

const RESIDENT_CONTACTS_API = "/resident-contacts";

export interface ResidentContact {
  id: number;
  email?: string;
  phoneNumber?: string;
  cccd: string;
  address?: string;
  createdAt: string;
}

export interface CreateResidentContactPayload {
  email?: string;
  phoneNumber?: string;
  cccd: string;
  address?: string;
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export const bulkCreateResidentContacts = async (
  contacts: CreateResidentContactPayload[]
): Promise<ApiResponse<{ success: number; skipped: number; errors: string[] }>> => {
  const response = await BASE_URL.post(
    `${RESIDENT_CONTACTS_API}/bulk`,
    { contacts },
    { headers: authHeaders() }
  );
  return response.data;
};

export const getResidentContacts = async (params?: {
  page?: number;
  limit?: number;
  keyword?: string;
}): Promise<PaginatedResponse<ResidentContact>> => {
  const response = await BASE_URL.get(RESIDENT_CONTACTS_API, {
    params,
    headers: authHeaders(),
  });
  return response.data;
};

export const checkCccd = async (
  cccd: string
): Promise<ApiResponse<ResidentContact> & { isMatched: boolean }> => {
  const response = await BASE_URL.get(
    `${RESIDENT_CONTACTS_API}/check/${cccd}`,
    { headers: authHeaders() }
  );
  return response.data;
};

export const deleteResidentContact = async (id: number): Promise<ApiResponse<null>> => {
  const response = await BASE_URL.delete(`${RESIDENT_CONTACTS_API}/${id}`, {
    headers: authHeaders(),
  });
  return response.data;
};
