import { BASE_URL } from "@/apis";
import type { ApiResponse, PaginatedResponse } from "@/components/interfaces/response.interface";
import type { DispatchReport, DispatchReportStatus, DispatchReportType } from "../interfaces";

const PATH = "dispatch-reports";

export interface DispatchReportParams {
  page?: number;
  limit?: number;
  status?: DispatchReportStatus;
  type?: DispatchReportType;
  reflectionId?: number;
  search?: string;
}

/** Danh sách biên bản điều chuyển */
export const getDispatchReportsApi = async (params: DispatchReportParams) => {
  const response = await BASE_URL.get<PaginatedResponse<DispatchReport>>(`/${PATH}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    params,
  });
  return response.data;
};

/** Chi tiết biên bản */
export const getDispatchReportApi = async (id: number) => {
  const response = await BASE_URL.get<ApiResponse<DispatchReport>>(`/${PATH}/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** Biên bản theo phản ánh */
export const getDispatchReportsByReflectionApi = async (reflectionId: number) => {
  const response = await BASE_URL.get<ApiResponse<DispatchReport[]>>(
    `/${PATH}/reflection/${reflectionId}`,
    { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } },
  );
  return response.data;
};

/** [MANAGER] Tạo điều chuyển cho Hậu kiểm */
export const createDispatchToInspectorApi = async (data: {
  reflectionId: number;
  assignedTo: number;
  title?: string;
  description?: string;
  note?: string;
  expectedTime?: string;
}) => {
  const response = await BASE_URL.post<ApiResponse<DispatchReport>>(
    `/${PATH}/to-inspector`,
    data,
    { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } },
  );
  return response.data;
};

/** [INSPECTOR] Tạo điều chuyển cho Tuần tra */
export const createDispatchToPatrolApi = async (data: {
  reflectionId: number;
  assignedTo?: number;
  customHandler?: string;
  title?: string;
  description?: string;
  note?: string;
  expectedTime?: string;
}) => {
  const response = await BASE_URL.post<ApiResponse<DispatchReport>>(
    `/${PATH}/to-patrol`,
    data,
    { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } },
  );
  return response.data;
};

/** Xác nhận nhận điều chuyển */
export const acceptDispatchApi = async (id: number) => {
  const response = await BASE_URL.patch<ApiResponse<DispatchReport>>(
    `/${PATH}/${id}/accept`,
    {},
    { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } },
  );
  return response.data;
};

/** Cập nhật biên bản báo cáo */
export const updateDispatchReportApi = async (
  id: number,
  data: {
    status?: DispatchReportStatus;
    reportContent?: string;
    reflectionStatusUpdate?: string;
    rejectReason?: string;
    attachments?: string[];
    title?: string;
    description?: string;
    expectedTime?: string;
  },
) => {
  const response = await BASE_URL.patch<ApiResponse<DispatchReport>>(
    `/${PATH}/${id}`,
    data,
    { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } },
  );
  return response.data;
};

/** Xóa biên bản */
export const deleteDispatchReportApi = async (id: number) => {
  const response = await BASE_URL.delete<ApiResponse<DispatchReport>>(`/${PATH}/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** Lấy danh sách phản ánh đã xác minh */
export const getVerifiedReflectionsApi = async (status = "VERIFIED") => {
  const response = await BASE_URL.get<PaginatedResponse<any>>("/reports", {
    params: { limit: 100, status },
  });
  return response.data;
};

/** Lấy danh sách cán bộ theo roleCode */
export const getStaffByRoleApi = async (roleCode: string) => {
  const response = await BASE_URL.get<PaginatedResponse<{ id: number; fullName: string }>>("/human-resources", {
    params: { roleCode, limit: 100 },
  });
  return response.data;
};

/** Thúc giục cán bộ xử lý */
export const nudgeDispatchApi = async (id: number) => {
  const response = await BASE_URL.post<ApiResponse<any>>(
    `/${PATH}/${id}/nudge`,
    {},
    { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } },
  );
  return response.data;
};

