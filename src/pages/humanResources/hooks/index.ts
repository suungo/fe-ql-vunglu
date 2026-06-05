import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createHumanResource, deteleHumanResource, getDetailHumanResource, getListHumanResource, getHRVerificationHistory } from "../api";


// 🧠 KEY chuẩn để cache
const HUMAN_RESOURCE_KEY = "human-resources";

// =======================
// 📌 GET LIST
// =======================
export const useHumanResources = (
  keyword: string,
  limit: number,
  page: number,
  status?: string
) => {
  return useQuery({
    queryKey: [HUMAN_RESOURCE_KEY, keyword, limit, page, status],
    queryFn: () => getListHumanResource(keyword, limit, page, status),
  });
};

// =======================
// 📌 GET DETAIL
// =======================
export const useHumanResourceDetail = (id?: number) => {
  return useQuery({
    queryKey: [HUMAN_RESOURCE_KEY, id],
    queryFn: () => getDetailHumanResource(id!),
    enabled: !!id, // chỉ call khi có id
  });
};

// =======================
// 📌 GET VERIFICATION HISTORY
// =======================
export const useHRVerificationHistory = (employeeCode?: string) => {
  return useQuery({
    queryKey: ['hr-verification-history', employeeCode],
    queryFn: () => getHRVerificationHistory(employeeCode!),
    enabled: !!employeeCode,
  });
};

// =======================
// 📌 CREATE
// =======================
export const useCreateHumanResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHumanResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HUMAN_RESOURCE_KEY] });
    },
  });
};



// =======================
// 📌 DELETE
// =======================
export const useDeleteHumanResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deteleHumanResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HUMAN_RESOURCE_KEY] });
    },
  });
};