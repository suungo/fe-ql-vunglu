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
  nudgeDispatchApi,
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
export const useVerifiedReflections = (status = "VERIFIED", enabled = true) => {
  return useQuery({
    queryKey: ["verified-reflections", status],
    queryFn: () => getVerifiedReflectionsApi(status),
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
export const useDispatchSocket = (
  refetch: () => void,
  onPatrolLocationUpdated?: (data: { id: number; lat: number; lng: number }) => void,
  onNotification?: (noti: any) => void
) => {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const socket: Socket = io(`${socketUrl}/notifications`, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("newNotification", (noti: any) => {
      if (onNotification) {
        onNotification(noti);
      }
      if (
        noti?.type?.startsWith("DISPATCH_") ||
        noti?.type?.startsWith("PATROL_") ||
        noti?.type?.startsWith("REFLECTION_") ||
        noti?.title?.includes("điều chuyển") ||
        noti?.title?.includes("tuần tra")
      ) {
        refetch();
      }
    });

    if (onPatrolLocationUpdated) {
      socket.on("patrol_location_updated", onPatrolLocationUpdated);
    }

    return () => {
      socket.disconnect();
    };
  }, [refetch, onPatrolLocationUpdated, onNotification]);
};

// 10. Hook thúc giục cán bộ
export const useNudgeDispatch = () => {
  return useMutation({
    mutationFn: nudgeDispatchApi,
  });
};
