import { BASE_URL } from "@/apis";

export const getReports = async (limit: number = 1000) => {
  return await BASE_URL.get("/reports", {
    params: { limit },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
};

export const getDashboardStats = async () => {
  return await BASE_URL.get("/statistics/dashboard", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
};
