import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import {
  getDispatchReportsApi,
  getDispatchReportApi,
  createDispatchToInspectorApi,
  createDispatchToPatrolApi,
  acceptDispatchApi,
  updateDispatchReportApi,
  getVerifiedReflectionsApi,
  getStaffByRoleApi,
  type DispatchReportParams,
} from "../api";
import { DispatchReportStatus } from "../interfaces";

// 1. Hook lấy danh sách điều chuyển
export const useDispatchReports = (params: DispatchReportParams) => {
  return useQuery({
    queryKey: ["dispatch-reports", params],
    queryFn: () => getDispatchReportsApi(params),
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
};

// 2. Hook lấy chi tiết một điều chuyển
export const useDispatchReport = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ["dispatch-report", id],
    queryFn: () => getDispatchReportApi(id),
    enabled: !!id && enabled,
  });
};

// 3. Hook lấy danh sách phản ánh đã xác minh
export const useVerifiedReflections = (enabled = true) => {
  return useQuery({
    queryKey: ["verified-reflections"],
    queryFn: getVerifiedReflectionsApi,
    enabled,
  });
};

// 4. Hook lấy danh sách cán bộ theo role
export const useStaffList = (roleCode: string, enabled = true) => {
  return useQuery({
    queryKey: ["staff-list", roleCode],
    queryFn: () => getStaffByRoleApi(roleCode),
    enabled: !!roleCode && enabled,
  });
};

// 5. Hook tạo điều chuyển đến Hậu kiểm
export const useCreateDispatchToInspector = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDispatchToInspectorApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-reports"] });
      queryClient.invalidateQueries({ queryKey: ["verified-reflections"] });
    },
  });
};

// 6. Hook tạo điều chuyển đến Tuần tra
export const useCreateDispatchToPatrol = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDispatchToPatrolApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-reports"] });
      queryClient.invalidateQueries({ queryKey: ["verified-reflections"] });
    },
  });
};

// 7. Hook xác nhận nhận điều chuyển
export const useAcceptDispatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptDispatchApi,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-reports"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch-report", id] });
    },
  });
};

// 8. Hook cập nhật biên bản báo cáo
export const useUpdateDispatchReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateDispatchReportApi>[1];
    }) => updateDispatchReportApi(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-reports"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch-report", id] });
    },
  });
};

// 9. Hook Socket realtime tự động reload khi có thông báo mới liên quan đến điều chuyển
export const useDispatchSocket = (refetch: () => void) => {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const socket: Socket = io(`${socketUrl}/notifications`, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("newNotification", (noti: any) => {
      if (
        noti?.type?.startsWith("DISPATCH_") ||
        noti?.title?.includes("điều chuyển")
      ) {
        refetch();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);
};
