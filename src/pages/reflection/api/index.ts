import { BASE_URL } from "@/apis";
import type { ApiResponse } from "@/components/interfaces/response.interface";
import type { ReflectionStatus } from "../enum";
import type { CreateReflection, UpdateReflection } from "../interfaces";


const REPORT = "reports"

export interface ParamsReflection {
  page?: number
  limit?: number
  keyword?: string
  category?: string
  priority?: string
  status?: ReflectionStatus,
}
// Api thêm phản ánh
export const createReflectionApi = async (data: CreateReflection) => {
  const response = await BASE_URL.post<ApiResponse<CreateReflection>>(`/${REPORT}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

// API cập nhật phản ánh
export const updateReflectionApi = async (data: UpdateReflection) => {
  const response = await BASE_URL.put(`/${REPORT}/${data.id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};


// API lấy danh sách phản ánh
export const getReflectionsApi = async (params: ParamsReflection) => {
  const response = await BASE_URL.get(`/${REPORT}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    params,
  });
  return response.data;
};

// API lấy chi tiết phản ánh
export const getReflectionApi = async (id: number) => {
  const response = await BASE_URL.get(`/${REPORT}/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

// API xóa phản ánh
export const deleteReflectionApi = async (id: number) => {
  const response = await BASE_URL.delete(`/${REPORT}/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

export const updateReflectionStatusApi = async (id: number, status: ReflectionStatus) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/status`, { status }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
};

// API upload file lên Cloudinary thông qua Backend
export const uploadApi = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await BASE_URL.post<{ url: string }>(`/upload/file`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// ══════════════════════════════════════════════════════════════════════
// WORKFLOW ENDPOINTS
// ══════════════════════════════════════════════════════════════════════

/** [OFFICER] Bước 3: Xác minh thực địa phản ánh */
export const verifyReflectionApi = async (
  id: number,
  data: { confirmed: boolean; rejectReason?: string; note?: string }
) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/verify`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** [MANAGER/ADMIN] Bước 4: Giao phản ánh cho Hậu kiểm */
export const assignReflectionApi = async (
  id: number,
  data: { inspectorId: number; note?: string }
) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/assign`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** [INSPECTOR/MANAGER] Bước 5: Điều cán bộ tuần tra xử lý */
export const dispatchPatrolApi = async (
  id: number,
  data: { patrolId: number; estimatedHandleMinutes?: number; note?: string }
) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/dispatch`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** [INSPECTOR] Nhận việc được phân công */
export const acceptByInspectorApi = async (id: number) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/accept-inspector`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** [PATROL] Nhận việc được điều động */
export const acceptByPatrolApi = async (id: number) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/accept-patrol`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** [PATROL] Bước 8: Nộp báo cáo kết quả thực địa */
export const submitPatrolReportApi = async (
  id: number,
  data: {
    resolved: boolean;
    patrolReport: string;
    needReinforcement?: boolean;
    incompleteReason?: string;
  }
) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/patrol-report`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** [INSPECTOR/MANAGER] Bước 9: Xác nhận hoàn thành và gửi báo cáo */
export const inspectorConfirmApi = async (id: number, data: { note?: string }) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/inspector-confirm`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};