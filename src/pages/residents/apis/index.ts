import axios from "axios"
import { BASE_URL } from "@/apis"
import type { ApiResponse, PaginatedResponse } from "@/components/interfaces/response.interface"
import type { HasBusiness, HasChildren, HasElderly, HasPregnant, HasSick } from "../enum"
import type { CreateResident, Resident, UpdateResident } from "../interfaces"

const RESIDENTS_API = '/residents'

// Instance riêng để gọi đến hệ thống xác thực dân cư
const RESIDENT_VERIFY_URL = axios.create({
  baseURL: window.location.hostname === 'ql-vunglu.site'
    ? 'https://ql-vunglu.site/api-dancu/v1'
    : 'http://localhost:3002/api-dancu/v1',
  timeout: 10000,
});

export interface ResidentVerificationHistoryItem {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fullName: string;
  phoneNumber: string;
  address: string;
  isMatchedContact: boolean;
  matchedMessage: string;
  createdAt: string;
  updatedAt?: string;
}

// API lấy lịch sử xác thực cư dân theo phoneNumber
export const getResidentVerificationHistory = async (phoneNumber: string): Promise<{ data: ResidentVerificationHistoryItem[], total: number }> => {
  const response = await RESIDENT_VERIFY_URL.get('/verifications', {
    params: { phoneNumber }
  });
  return response.data;
};

export interface filterResidents {
    page: number
    limit: number
    keyword?: string
    houseType?: string
    hasElderly?: HasElderly
    hasChildren?: HasChildren
    hasPregnantWomen?: HasPregnant
    hasChronicDisease?: HasSick
    hasBusiness?: HasBusiness
}

// api thêm hộ dân 
export const createResident = async (value: CreateResident) => {
    const response = await BASE_URL.post<ApiResponse<CreateResident>>(`${RESIDENTS_API}`, value, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        }
    })
    return response.data
}

// API cập nhật hộ dân 
export const updateResident = async (id: number, value: UpdateResident) => {
    const response = await BASE_URL.patch<ApiResponse<UpdateResident>>(`${RESIDENTS_API}/${id}`, value, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        }
    })
    return response.data
}

// API lấy danh sách hộ danh (có phân trang, tìm kiếm, lọc theo loại nhà, có người già, có trẻ em, có phụ nữ mang thai, có người bị bệnh nền, có kinh doanh)
export const getResidents = async (filter: filterResidents) => {
    const response = await BASE_URL.get<PaginatedResponse<Resident>>(RESIDENTS_API, { params: filter,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        }
     })
    return response.data
}

// API lấy chi tiết hộ dân 
export const getResidentById = async (id: number) => {
    const response = await BASE_URL.get<ApiResponse<Resident>>(`${RESIDENTS_API}/${id}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        }
    })
    return response.data
}

// API xóa hộ dân 
export const deleteResident = async (id: number) => {
    const response = await BASE_URL.delete<ApiResponse<Resident>>(`${RESIDENTS_API}/${id}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        }
    })
    return response.data
}