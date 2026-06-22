import { BASE_URL } from "@/apis";

const token = () => localStorage.getItem("accessToken");
const headers = () => ({ Authorization: `Bearer ${token()}` });

// ─── LIKES ───────────────────────────────────────────────────────────────────

/** Toggle like/unlike một phản ánh */
export const toggleLikeApi = (reportId: number) =>
  BASE_URL.post(`/reports/${reportId}/like`, {}, { headers: headers() });

/** Kiểm tra user hiện tại đã like chưa */
export const checkLikedApi = (reportId: number) =>
  BASE_URL.get(`/reports/${reportId}/liked`, { headers: headers() });

/** Lấy tổng số likes */
export const getLikeCountApi = (reportId: number) =>
  BASE_URL.get(`/reports/${reportId}/likes/count`, { headers: headers() });

// ─── COMMENTS ────────────────────────────────────────────────────────────────

/** Lấy danh sách bình luận */
export const getCommentsApi = (reportId: number, page = 1, limit = 20) =>
  BASE_URL.get(`/reports/${reportId}/comments`, {
    params: { page, limit },
    headers: headers(),
  });

/** Tạo bình luận mới */
export const createCommentApi = (reportId: number, content: string, parentId?: number) =>
  BASE_URL.post(
    `/reports/${reportId}/comments`,
    { content, parentId },
    { headers: headers() }
  );

/** Lấy số lượng bình luận */
export const getCommentCountApi = (reportId: number) =>
  BASE_URL.get(`/reports/${reportId}/comments/count`, { headers: headers() });
