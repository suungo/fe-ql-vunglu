import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { io, type Socket } from "socket.io-client";
import { getProfileApi } from "@/pages/profile/api";
import { BASE_URL } from "@/apis";
import { assignReflectionApi } from "../../reflection/api";
import {
  deleteVerificationApi,
  getVerificationsApi,
  updateVerificationApi,
} from "../api";
import {
  VerificationStatus,
  type NotificationSocket,
  type Verification,
} from "../interfaces";

export const useVerificationData = () => {
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [inspectorList, setInspectorList] = useState<{ id: number; fullName: string }[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState<number | null>(null);
  const [assignNote, setAssignNote] = useState("");

  const {
    data: verifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["verifications", page, limit],
    queryFn: () => getVerificationsApi({ page, limit }),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const socket: Socket = io(`${socketUrl}/notifications`, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("[Verification] Connected to notification socket");
    });

    socket.on("newNotification", (notification: NotificationSocket) => {
      const relatedTypes = [
        "REFLECTION_UPDATE",
        "NEW_REFLECTION",
        "REFLECTION_RESOLVED",
        "VERIFICATION_UPDATE",
      ];
      if (
        relatedTypes.includes(notification?.type || "") ||
        notification?.referenceId ||
        notification?.title?.toLowerCase().includes("phản ánh") ||
        notification?.title?.toLowerCase().includes("xác minh")
      ) {
        refetch();
      }
    });

    socket.on("connect_error", (error: Error) => {
      console.error("[Verification] Socket error:", error);
    });
    return () => {
      socket.disconnect();
    };
  }, [refetch]);

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const handleVerify = async (id: number, status: VerificationStatus) => {
    try {
      setIsUpdating(true);
      await updateVerificationApi(id, { status });
      notification.success({
        title: "Thành công",
        description:
          status === VerificationStatus.APPROVED
            ? "Đã duyệt yêu cầu!"
            : "Đã từ chối yêu cầu!",
      });
      refetch();
      if (selectedVerification?.id === id) {
        setIsDetailModalOpen(false);
      }
    } catch {
      notification.error({
        title: "Thất bại",
        description: "Thao tác thất bại",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const loadInspectors = async () => {
    try {
      const response = await BASE_URL.get("/human-resources", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        params: { roleCode: "INSPECTOR", limit: 100 },
      });
      const list = response.data?.data || [];
      setInspectorList(list);
    } catch {
      notification.error({
        title: "Lỗi",
        description: "Không thể tải danh sách Hậu kiểm",
      });
    }
  };

  const handleAssignInspector = async () => {
    if (!selectedVerification?.referenceId || !selectedInspectorId) return;
    try {
      setIsUpdating(true);
      await assignReflectionApi(selectedVerification.referenceId, {
        inspectorId: selectedInspectorId,
        note: assignNote || undefined,
      });
      await updateVerificationApi(selectedVerification.id, {
        status: VerificationStatus.COMPLETED,
      });
      notification.success({
        title: "Thành công",
        description: "Đã phân công Hậu kiểm xử lý phản ánh!",
      });
      setIsAssignModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedInspectorId(null);
      setAssignNote("");
      refetch();
    } catch {
      notification.error({
        title: "Thất bại",
        description: "Không thể phân công. Vui lòng thử lại.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVerification) return;
    try {
      setIsDeleting(true);
      await deleteVerificationApi(selectedVerification.id);
      notification.success({
        title: "Thành công",
        description: "Đã xóa yêu cầu xác thực!",
      });
      setIsDeleteModalOpen(false);
      refetch();
    } catch {
      notification.error({
        title: "Thất bại",
        description: "Xóa thất bại",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    selectedVerification, setSelectedVerification,
    isDetailModalOpen, setIsDetailModalOpen,
    page, setPage,
    limit,
    isUpdating, setIsUpdating,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isDeleting,
    isAssignModalOpen, setIsAssignModalOpen,
    inspectorList,
    selectedInspectorId, setSelectedInspectorId,
    assignNote, setAssignNote,
    verifications, isLoading, refetch,
    profileData,
    handleVerify, loadInspectors, handleAssignInspector, handleDelete
  };
};
