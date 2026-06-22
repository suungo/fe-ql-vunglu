import { BASE_URL } from "@/apis";

export const getReputationUsers = async (page: number, limit: number, keyword: string) => {
  return await BASE_URL.get("/users", {
    params: { page, limit, keyword: keyword || undefined, roleCode: "RESIDENT" },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
};

export const getStaffWorkQuality = async (page: number, limit: number, keyword: string) => {
  return await BASE_URL.get("/users/work-quality", {
    params: { page, limit, keyword: keyword || undefined },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
};

export const updateReputationPoints = async (userId: number, points: number, reason?: string) => {
  return await BASE_URL.patch(
    `/users/${userId}/reputation`,
    { reputationPoints: points, reason },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    },
  );
};
