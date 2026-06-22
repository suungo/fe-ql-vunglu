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
  status?: ReflectionStatus;
  assignedUserId?: number;
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

// API lấy thống kê nhiệm vụ được giao
export const getAssignedStatsApi = async (userId: number) => {
  const response = await BASE_URL.get(`/${REPORT}/assigned-stats/${userId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
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
  data: { confirmed: boolean; rejectReason?: string; note?: string; priority?: string }
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

/** [PATROL] Cập nhật vị trí GPS */
export const updatePatrolLocationApi = async (id: number, data: { lat: number; lng: number }) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/patrol-location`, data, {
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
  const response = await BASE_URL.patch(`/${REPORT}/${id}/manager-confirm`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

// API lấy các phản ánh đã giải quyết (RESOLVED) để quản lý phường đăng lên bản đồ
export const getResolvedReflectionsApi = async () => {
  const response = await BASE_URL.get(`/${REPORT}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    params: {
      status: "RESOLVED",
      limit: 100,
    },
  });
  return response.data;
};

// ══════════════════════════════════════════════════════════════════════
// LIKES ENDPOINTS
// ══════════════════════════════════════════════════════════════════════

/** Toggle like/unlike phản ánh */
export const toggleLikeApi = async (reflectionId: number) => {
  const response = await BASE_URL.post(`/${REPORT}/${reflectionId}/like`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** Kiểm tra đã like chưa */
export const checkLikedApi = async (reflectionId: number) => {
  const response = await BASE_URL.get(`/${REPORT}/${reflectionId}/liked`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** Lấy số lượng likes */
export const getLikeCountApi = async (reflectionId: number) => {
  const response = await BASE_URL.get(`/${REPORT}/${reflectionId}/likes/count`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

// ══════════════════════════════════════════════════════════════════════
// COMMENTS ENDPOINTS
// ══════════════════════════════════════════════════════════════════════

/** Lấy danh sách bình luận */
export const getCommentsApi = async (reflectionId: number, page = 1, limit = 20) => {
  const response = await BASE_URL.get(`/${REPORT}/${reflectionId}/comments`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    params: { page, limit },
  });
  return response.data;
};

/** Tạo bình luận mới */
export const createCommentApi = async (reflectionId: number, content: string, parentId?: number) => {
  const response = await BASE_URL.post(`/${REPORT}/${reflectionId}/comments`, { content, parentId }, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** Xóa bình luận */
export const deleteCommentApi = async (commentId: number) => {
  const response = await BASE_URL.delete(`/${REPORT}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** Lấy số lượng bình luận */
export const getCommentCountApi = async (reflectionId: number) => {
  const response = await BASE_URL.get(`/${REPORT}/${reflectionId}/comments/count`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};

/** Đánh giá chất lượng xử lý của cán bộ */
export const rateReflectionApi = async (id: number, data: { rating: number; comment?: string }) => {
  const response = await BASE_URL.patch(`/${REPORT}/${id}/rate`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
  return response.data;
};