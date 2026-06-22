import axios from "axios";
import { message, notification } from "antd";

let isRedirecting = false;

// 🔥 Tạo instance axios
export const BASE_URL = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 10000, // 🔥 tăng timeout (10s)
  headers: {
    "Content-Type": "application/json",
  },
});


// =======================
// 🔐 REQUEST INTERCEPTOR
// =======================
BASE_URL.interceptors.request.use(
  (config) => {
    // 👉 gắn token nếu có
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// =======================
// 🔐 RESPONSE INTERCEPTOR
// =======================
BASE_URL.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // 🔥 Xử lý lỗi 401: Token hết hạn hoặc không hợp lệ (không bao gồm route đăng nhập)
    if (
      error.response &&
      error.response.status === 401 &&
      !config?.url?.includes("/auth/login")
    ) {
      if (!isRedirecting) {
        isRedirecting = true;
        notification.warning({
          title: "Phiên đăng nhập đã hết hạn",
          description: "Vui lòng đăng nhập lại",
        });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // Chuyển hướng sang trang đăng nhập nếu chưa ở trang login
        if (window.location.pathname !== "/login") {
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        } else {
          isRedirecting = false;
        }
      }
      return Promise.reject(error);
    }

    // 🔥 nếu không có config thì reject luôn
    if (!config) {
      return Promise.reject(error);
    }

    // 🔥 tạo biến đếm retry
    config.__retryCount = config.__retryCount || 0;

    // 🎯 chỉ retry khi timeout
    if (error.code === "ECONNABORTED") {
      if (config.__retryCount < 2) {
        config.__retryCount += 1;
        console.log(`🔁 Retry lần ${config.__retryCount}`);
        return BASE_URL.request(config);
      }
      console.log("❌ Đã retry quá 2 lần");
    }

    return Promise.reject(error);
  }
);