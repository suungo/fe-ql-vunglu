import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Image,
  Input,
  Modal,
  Rate,
  Select,
  Spin,
  Switch,
  Tag,
  Typography,
  notification,
  Tabs,
} from "antd";
import dayjs from "dayjs";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Compass,
  Send,
  ShieldCheck,
  UserCheck,
  XCircle,
  AlertTriangle,
  Home,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL } from "@/apis";
import { getProfileApi } from "@/pages/profile/api";
import {
  acceptByInspectorApi,
  acceptByPatrolApi,
  assignReflectionApi,
  checkLikedApi,
  createCommentApi,
  deleteCommentApi,
  dispatchPatrolApi,
  getCommentCountApi,
  getCommentsApi,
  getReflectionApi,
  inspectorConfirmApi,
  submitPatrolReportApi,
  toggleLikeApi,
  verifyReflectionApi,
  updatePatrolLocationApi,
  rateReflectionApi,
} from "../api";
import { Priority, ReflectionStatus } from "../enum";
import { useDispatchSocket } from "@/pages/dispatch/hooks";
import { Role } from "@/enums";
import { ReflectionDetailCard } from "../components/ReflectionDetailCard";
import { ReflectionTimeline } from "../components/ReflectionTimeline";
import { ReflectionMap } from "../components/ReflectionMap";
import { ReflectionSidebar } from "../components/ReflectionSidebar";
import { ReflectionActionModal } from "../components/ReflectionActionModal";

// --- Countdown Component ---
const CountdownTimer = ({
  targetDate,
  onExpire,
}: {
  targetDate: string | Date;
  onExpire?: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  React.useEffect(() => {
    const tDate = new Date(targetDate);
    const calc = () =>
      Math.max(
        0,
        5 * 60 - Math.floor((new Date().getTime() - tDate.getTime()) / 1000),
      );
    setTimeLeft(calc());

    const timer = setInterval(() => {
      const left = calc();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        setExpired(true);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft <= 0 || expired)
    return <span className="text-red-500 font-bold">Đã hết giờ (5:00)</span>;
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  return (
    <span className="text-blue-600 font-bold text-lg">
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
};

const { Title, Paragraph, Text } = Typography;

type ModalType =
  | "REJECT"
  | "ASSIGN"
  | "DISPATCH"
  | "REPORT"
  | "CONFIRM"
  | "VERIFY"
  | null;

// ── Status / label helpers ─────────────────────────────────────────────────
const getStatusTag = (status?: ReflectionStatus) => {
  const map: Record<string, { color: string; label: string }> = {
    PENDING: { color: "orange", label: "Chờ xác minh" },
    VERIFIED: { color: "blue", label: "Đã xác minh" },
    ASSIGNED: { color: "purple", label: "Đã phân công" },
    IN_PROGRESS: { color: "geekblue", label: "Đang xử lý" },
    COMPLETED: { color: "cyan", label: "Chờ xác nhận" },
    RESOLVED: { color: "green", label: "Đã hoàn thành" },
    REJECTED: { color: "red", label: "Từ chối" },
  };
  const cfg = map[status ?? ""] ?? { color: "default", label: "Mới" };
  return (
    <Tag color={cfg.color} className="px-3 py-1 text-sm font-medium">
      {cfg.label}
    </Tag>
  );
};

const getPriorityText = (p?: Priority) => {
  switch (p) {
    case Priority.LOW:
      return "Thấp";
    case Priority.MEDIUM:
      return "Trung bình";
    case Priority.HIGH:
      return "Cao";
    default:
      return "Chưa xác định";
  }
};

// ══════════════════════════════════════════════════════════════════════════════
export default function DetailReflection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Rating
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateValue, setRateValue] = useState(5);
  const [rateComment, setRateComment] = useState("");
  const [rateSubmitting, setRateSubmitting] = useState(false);

  // Modal states managed by ReflectionActionModal
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Like / Comment states
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // User lists for assignment
  const [inspectors, setInspectors] = useState<
    { id: number; fullName: string }[]
  >([]);
  const [patrols, setPatrols] = useState<{ id: number; fullName: string }[]>(
    [],
  );

  // ── Data Queries ─────────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reflection", id],
    queryFn: () => getReflectionApi(Number(id)),
    enabled: !!id,
  });

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await getProfileApi();
      return res?.data;
    },
  });

  const reflection = data?.data;
  const roleCode: string = profileData?.role?.roleCode ?? "";
  const status: ReflectionStatus = reflection?.status;

  // ── Load Like / Comment data ──────────────────────────────────────────────
  useEffect(() => {
    if (!reflection?.id) return;
    const rid = reflection.id;
    // Fetch liked status + count
    checkLikedApi(rid)
      .then((res: any) => setLiked(res?.liked ?? false))
      .catch(() => {});
    getCommentCountApi(rid)
      .then((res: any) => setCommentCount(res?.data?.count ?? 0))
      .catch(() => {});
    getCommentsApi(rid, 1, 50)
      .then((res: any) => setComments(res?.data ?? []))
      .catch(() => {});
  }, [reflection?.id]);

  const handleToggleLike = async () => {
    if (!reflection?.id) return;
    try {
      const res = await toggleLikeApi(reflection.id);
      setLiked(res?.data?.liked ?? !liked);
      setLikeCount(res?.data?.totalLikes ?? likeCount);
    } catch {
      notification.error({
        title: "Lỗi",
        description: "Không thể thực hiện thao tác.",
      });
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        notification.success({
          title: "Thành công",
          description: "Đã sao chép link chia sẻ!",
        });
      })
      .catch(() => {
        notification.info({ title: "Thông tin", description: url });
      });
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !reflection?.id) return;
    setCommentSubmitting(true);
    try {
      await createCommentApi(
        reflection.id,
        commentInput.trim(),
        replyingTo?.id,
      );
      setCommentInput("");
      setReplyingTo(null);
      const res = await getCommentsApi(reflection.id, 1, 50);
      setComments(res?.data ?? []);
      const countRes = await getCommentCountApi(reflection.id);
      setCommentCount(countRes?.data?.count ?? 0);
    } catch {
      notification.error({
        title: "Lỗi",
        description: "Không thể gửi bình luận.",
      });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteCommentApi(commentId);
      const res = await getCommentsApi(reflection.id, 1, 50);
      setComments(res?.data ?? []);
      const countRes = await getCommentCountApi(reflection.id);
      setCommentCount(countRes?.data?.count ?? 0);
    } catch {
      notification.error({
        title: "Lỗi",
        description: "Không thể xóa bình luận.",
      });
    }
  };

  const handlePatrolLocationUpdate = useCallback(
    (socketData: { id: number; lat: number; lng: number }) => {
      if (Number(id) === socketData.id) {
        queryClient.setQueryData(["reflection", id], (old: any) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              patrolLat: socketData.lat,
              patrolLng: socketData.lng,
            },
          };
        });
      }
    },
    [id, queryClient],
  );

  const handleNotification = useCallback(
    (noti: any) => {
      if (
        noti?.type === "REFLECTION_RESOLVED" &&
        noti?.referenceId === Number(id) &&
        roleCode === "RESIDENT"
      ) {
        setIsRateModalOpen(true);
      }
    },
    [id, roleCode],
  );

  useDispatchSocket(refetch, handlePatrolLocationUpdate, handleNotification);

  const handleUpdatePatrolLocation = async () => {
    if (!navigator.geolocation) {
      notification.error({
        title: "Lỗi",
        description: "Trình duyệt của bạn không hỗ trợ định vị GPS.",
      });
      return;
    }
    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updatePatrolLocationApi(Number(id), {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          notification.success({
            title: "Thành công",
            description: `Tọa độ: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
          });
          refetch();
        } catch (err: any) {
          notification.error({
            title: "Không thể cập nhật vị trí",
            description: err?.response?.data?.message ?? "Vui lòng thử lại.",
          });
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        setIsLocationLoading(false);
        notification.error({
          title: "Lỗi định vị GPS",
          description:
            "Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleToggleNavigation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      notification.info({
        title: "Đã dừng đi đường",
        description: "Đã tắt cập nhật vị trí thời gian thực.",
      });
      return;
    }

    if (!navigator.geolocation) {
      notification.error({
        title: "Lỗi",
        description: "Trình duyệt của bạn không hỗ trợ định vị GPS.",
      });
      return;
    }

    const idVal = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await updatePatrolLocationApi(Number(id), {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        } catch (err) {
          console.error("Lỗi cập nhật tọa độ đi đường:", err);
        }
      },
      (error) => {
        notification.error({
          title: "Lỗi định vị",
          description: "Không thể lấy vị trí GPS thời gian thực.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    setWatchId(idVal);
    notification.success({
      title: "Bắt đầu đi đường",
      description:
        "Hệ thống đang theo dõi và cập nhật vị trí của bạn lên bản đồ Leaflet.",
    });
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // ── Load lists for assignment modals ──────────────────────────────────────
  const loadUsersByRole = async (role: string) => {
    const res = await BASE_URL.get(`/users/role/${role}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    return res.data?.data ?? res.data ?? [];
  };

  const openModal = async (type: ModalType) => {
    setModalType(type);
    if (type === "ASSIGN") {
      const list = await loadUsersByRole("INSPECTOR");
      setInspectors(list);
    } else if (type === "DISPATCH") {
      const list = await loadUsersByRole("PATROL");
      setPatrols(list);
    }
  };

  const closeModal = () => setModalType(null);

  // ── Workflow action handlers ───────────────────────────────────────────────
  const handleSubmit = async (values: {
    textInput: string;
    extraInput: string;
    selectedUserId: number | null;
    selectedPriority: Priority;
    resolvedInput: boolean;
  }) => {
    if (!id || !reflection) return;
    const rid = Number(id);
    setIsSubmitting(true);
    try {
      switch (modalType) {
        case "VERIFY":
          await verifyReflectionApi(rid, {
            confirmed: true,
            note: values.textInput || undefined,
            priority: values.selectedPriority,
          });
          notification.success({
            title: "Thành công",
            description: "Đã xác minh và chuyển lên Quản lý phường!",
          });
          break;
        case "REJECT":
          if (!values.textInput.trim()) {
            notification.error({
              title: "Lỗi",
              description: "Vui lòng nhập lý do từ chối.",
            });
            return;
          }
          await verifyReflectionApi(rid, {
            confirmed: false,
            rejectReason: values.textInput,
          });
          notification.success({
            title: "Thành công",
            description: "Đã từ chối phản ánh.",
          });
          break;
        case "ASSIGN":
          if (!values.selectedUserId) {
            notification.error({
              title: "Lỗi",
              description: "Vui lòng chọn cán bộ Hậu kiểm.",
            });
            return;
          }
          await assignReflectionApi(rid, {
            inspectorId: values.selectedUserId,
            note: values.textInput || undefined,
          });
          notification.success({
            title: "Thành công",
            description: "Đã phân công cho Hậu kiểm!",
          });
          break;
        case "DISPATCH": {
          if (!values.selectedUserId) {
            notification.error({
              title: "Lỗi",
              description: "Vui lòng chọn cán bộ Tuần tra.",
            });
            return;
          }
          const mins = Number(values.extraInput);
          if (!values.extraInput || isNaN(mins) || mins <= 0) {
            notification.error({
              title: "Lỗi",
              description: "Vui lòng nhập thời gian xử lý dự kiến (phút).",
            });
            return;
          }
          await dispatchPatrolApi(rid, {
            patrolId: values.selectedUserId,
            estimatedHandleMinutes: mins,
            note: values.textInput || undefined,
          });
          notification.success({
            title: "Thành công",
            description: "Đã điều động cán bộ Tuần tra!",
          });
          break;
        }
        case "REPORT":
          if (!values.resolvedInput && !values.textInput.trim()) {
            notification.error({
              title: "Lỗi",
              description: "Vui lòng nhập nội dung báo cáo.",
            });
            return;
          }
          if (!values.resolvedInput && !values.extraInput.trim()) {
            notification.error({
              title: "Lỗi",
              description: "Vui lòng nhập lý do chưa hoàn thành.",
            });
            return;
          }
          await submitPatrolReportApi(rid, {
            resolved: values.resolvedInput,
            patrolReport: values.textInput,
            incompleteReason: values.resolvedInput
              ? undefined
              : values.extraInput,
          });
          notification.success({
            title: "Thành công",
            description: "Đã nộp báo cáo thực địa!",
          });
          break;
        case "CONFIRM":
          await inspectorConfirmApi(rid, {
            note: values.textInput || undefined,
          });
          notification.success({
            title: "Thành công",
            description: "Đã xác nhận hoàn thành!",
          });
          queryClient.invalidateQueries({ queryKey: ["floodDamages"] });
          break;
      }
      closeModal();
      refetch();
    } catch (err: any) {
      notification.error({
        title: "Thao tác thất bại",
        description: err?.response?.data?.message ?? "Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRateSubmit = async () => {
    if (!id) return;
    setRateSubmitting(true);
    try {
      await rateReflectionApi(Number(id), {
        rating: rateValue,
        comment: rateComment.trim() || undefined,
      });
      notification.success({
        title: "Thành công",
        description: "Cảm ơn bạn đã đánh giá chất lượng phục vụ!",
      });
      setIsRateModalOpen(false);
      setRateComment("");
      refetch();
    } catch (err: any) {
      notification.error({
        title: "Thất bại",
        description: err?.response?.data?.message ?? "Không thể lưu đánh giá.",
      });
    } finally {
      setRateSubmitting(false);
    }
  };

  // ── Render Action Panel by role + status ──────────────────────────────────
  const renderActionPanel = () => {
    if (!reflection || !profileData) return null;

    // OFFICER: xác minh phản ánh PENDING
    if (roleCode === "OFFICER" && status === ReflectionStatus.PENDING) {
      return (
        <div className="flex items-center gap-3 mt-6">
          <Button
            danger
            icon={<XCircle size={15} />}
            onClick={() => openModal("REJECT")}
            size="large"
            className="flex-1"
          >
            Từ chối
          </Button>
          <Button
            type="primary"
            icon={<ShieldCheck size={15} />}
            size="large"
            className="flex-1"
            onClick={() => openModal("VERIFY")}
          >
            Xác minh hợp lệ
          </Button>
        </div>
      );
    }

    // MANAGER / ADMIN
    if (roleCode === "MANAGER" || roleCode === "ADMIN") {
      if (status === ReflectionStatus.VERIFIED) {
        return (
          <div className="mt-6">
            <Button
              type="primary"
              icon={<UserCheck size={15} />}
              size="large"
              block
              style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
              onClick={() => navigate("/app/dispatch-manager/list")}
            >
              Phân công cho Tuần tra
            </Button>
          </div>
        );
      }
      if (
        status === ReflectionStatus.IN_PROGRESS &&
        !reflection.patrolAcceptedAt &&
        reflection.dispatchedAt
      ) {
        return (
          <div className="mt-6 flex flex-col items-center gap-3 border p-4 rounded-xl bg-slate-50">
            <div className="text-sm text-slate-500">
              Đang chờ Tuần tra nhận việc...
            </div>
            <Button
              type="primary"
              size="large"
              block
              style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
              onClick={() => navigate("/app/dispatch-manager/list")}
            >
              Phân công lại Tuần tra
            </Button>
          </div>
        );
      }
    }

    // INSPECTOR
    if (roleCode === "INSPECTOR") {
      if (status === ReflectionStatus.ASSIGNED) {
        if (!reflection.inspectorAcceptedAt && reflection.assignedAt) {
          return (
            <div className="mt-6 flex flex-col items-center gap-3 border border-blue-100 p-4 rounded-xl bg-blue-50">
              <div className="text-sm font-bold text-blue-700">
                Bạn có 5 phút để nhận việc:
              </div>
              <CountdownTimer targetDate={reflection.assignedAt} />
              <Button
                type="primary"
                size="large"
                block
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await acceptByInspectorApi(Number(id));
                    notification.success({
                      title: "Thành công",
                      description: "Đã nhận việc thành công!",
                    });
                    refetch();
                  } catch (err: any) {
                    notification.error({
                      title: "Lỗi",
                      description: err?.response?.data?.message,
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                loading={isSubmitting}
              >
                Nhận việc ngay
              </Button>
            </div>
          );
        } else if (reflection.inspectorAcceptedAt) {
          return (
            <div className="mt-6">
              <Button
                type="primary"
                icon={<Compass size={15} />}
                size="large"
                block
                onClick={() => openModal("DISPATCH")}
              >
                Điều động cán bộ Tuần tra
              </Button>
            </div>
          );
        }
      }
      if (
        status === ReflectionStatus.IN_PROGRESS &&
        !reflection.patrolAcceptedAt &&
        reflection.dispatchedAt
      ) {
        return (
          <div className="mt-6 flex flex-col items-center gap-3 border p-4 rounded-xl bg-slate-50">
            <div className="text-sm text-slate-500">
              Đang chờ Tuần tra nhận việc...
            </div>
            <Button
              type="primary"
              size="large"
              block
              onClick={() => openModal("DISPATCH")}
            >
              Điều động lại Tuần tra
            </Button>
          </div>
        );
      }
    }

    // PATROL
    if (roleCode === "PATROL" && status === ReflectionStatus.IN_PROGRESS) {
      if (!reflection.patrolAcceptedAt) {
        return (
          <div className="mt-6 flex flex-col gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-amber-700 text-xs font-semibold m-0">
                Di chuyển đến địa điểm sự cố, sau đó xác nhận đã đến nơi
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                type="primary"
                size="large"
                className="w-full sm:flex-1 flex items-center justify-center gap-1.5"
                style={
                  watchId !== null
                    ? { backgroundColor: "#dc2626", borderColor: "#dc2626" }
                    : { backgroundColor: "#059669", borderColor: "#059669" }
                }
                onClick={handleToggleNavigation}
              >
                {watchId !== null ? "🛑 Dừng đi đường" : "🗺️ Đi đường"}
              </Button>
              <Button
                type="primary"
                size="large"
                className="w-full sm:flex-1"
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await acceptByPatrolApi(Number(id));
                    notification.success({
                      title: "Thành công",
                      description: "Đã nhận việc thành công!",
                    });
                    refetch();
                  } catch (err: any) {
                    notification.error({
                      title: "Lỗi",
                      description: err?.response?.data?.message,
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                loading={isSubmitting}
              >
                Xác nhận đến nơi
              </Button>
            </div>
          </div>
        );
      } else if (reflection.patrolAcceptedAt) {
        return (
          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="primary"
              size="large"
              className="w-full flex items-center justify-center gap-1.5"
              style={
                watchId !== null
                  ? { backgroundColor: "#dc2626", borderColor: "#dc2626" }
                  : { backgroundColor: "#059669", borderColor: "#059669" }
              }
              onClick={handleToggleNavigation}
            >
              {watchId !== null ? "🛑 Dừng đi đường" : "🗺️ Đi đường"}
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                type="primary"
                icon={<Compass size={15} />}
                size="large"
                className="w-full sm:flex-1"
                style={{ backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" }}
                onClick={handleUpdatePatrolLocation}
                loading={isLocationLoading}
              >
                Cập nhật GPS
              </Button>
              <Button
                type="primary"
                icon={<Send size={15} />}
                size="large"
                className="w-full sm:flex-1"
                style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                onClick={() => openModal("REPORT")}
              >
                Báo cáo kết quả
              </Button>
            </div>
          </div>
        );
      }
    }

    // INSPECTOR / MANAGER: xác nhận hoàn thành (COMPLETED)
    if (
      (roleCode === "INSPECTOR" || roleCode === "MANAGER") &&
      status === ReflectionStatus.COMPLETED
    ) {
      return (
        <div className="mt-6">
          <Button
            type="primary"
            icon={<CheckCircle2 size={15} />}
            size="large"
            block
            style={{ backgroundColor: "#059669", borderColor: "#059669" }}
            onClick={() => openModal("CONFIRM")}
          >
            Xác nhận sự cố hoàn thành
          </Button>
        </div>
      );
    }

    // RESIDENT: Đánh giá chất lượng xử lý khi sự cố đã được giải quyết (RESOLVED) và chưa có rating
    if (
      roleCode === "RESIDENT" &&
      status === ReflectionStatus.RESOLVED &&
      !reflection.rating &&
      reflection.userId === profileData.id
    ) {
      return (
        <div className="mt-6 flex flex-col items-center gap-3 border border-indigo-100 p-4 rounded-xl bg-indigo-50">
          <div className="text-sm font-bold text-indigo-700 text-center">
            Đánh giá chất lượng xử lý
          </div>
          <p className="text-xs text-slate-500 text-center m-0">
            Hãy đánh giá chất lượng hoàn thành công việc của cán bộ xử lý.
          </p>
          <Button
            type="primary"
            size="large"
            block
            style={{ backgroundColor: "#6366f1", borderColor: "#6366f1" }}
            onClick={() => setIsRateModalOpen(true)}
          >
            Đánh giá ngay (1 - 5 ⭐)
          </Button>
        </div>
      );
    }

    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!reflection) {
    return (
      <Card className="m-4">
        <Empty description="Không tìm thấy thông tin phản ánh" />
        <div className="mt-4 flex justify-center">
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm mx-auto">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Tabs
          defaultActiveKey="detail"
          type="card"
          className="custom-reflection-tabs"
          items={[
            {
              key: "detail",
              label: (
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-medium">
                    Thông tin phản ánh
                  </span>
                </div>
              ),
              children: (
                <div className="space-y-6 mt-2">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="px-4">
                        <Title level={3} className="mb-1!">
                          Chi tiết phản ánh
                        </Title>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Clock size={14} />
                          <span>
                            Gửi lúc:{" "}
                            {dayjs(reflection.createdAt).format(
                              "HH:mm DD/MM/YYYY",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusTag(reflection.status)}
                      {reflection.status === ReflectionStatus.PENDING &&
                        (reflection.userId === profileData?.id ||
                          reflection.user?.id === profileData?.id) && (
                          <Button
                            type="primary"
                            onClick={() =>
                              navigate(
                                `/app/reflection-manager/edit/${reflection.id}`,
                              )
                            }
                          >
                            Chỉnh sửa
                          </Button>
                        )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="w-full lg:w-2/3">
                      <ReflectionDetailCard reflection={reflection} />
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-1/3">
                      <ReflectionSidebar
                        reflection={reflection}
                        actionPanel={
                          renderActionPanel() ?? (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                              <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                <ShieldCheck
                                  size={28}
                                  className="text-slate-300"
                                />
                              </div>
                              <Text type="secondary" className="text-sm">
                                {status === ReflectionStatus.RESOLVED
                                  ? "Phản ánh đã được xử lý hoàn thành."
                                  : status === ReflectionStatus.REJECTED
                                    ? "Phản ánh đã bị từ chối."
                                    : "Không có hành động khả dụng cho role của bạn."}
                              </Text>
                            </div>
                          )
                        }
                      />
                    </div>
                  </div>

                  <ReflectionTimeline
                    reflection={reflection}
                    roleCode={roleCode}
                  />
                  <ReflectionMap reflection={reflection} />
                </div>
              ),
            },
            {
              key: "history",
              label: (
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-medium">
                    Lịch sử thao tác
                  </span>
                </div>
              ),
              children: (
                <div className="mt-2">
                  {(() => {
                    const getHistoryItems = () => {
                      const items: {
                        time: string;
                        label: string;
                        description: string;
                        icon: React.ReactNode;
                        color: string;
                        visible: boolean;
                      }[] = [];

                      const isAdminOrManager =
                        roleCode === "ADMIN" || roleCode === "MANAGER";
                      const currentUserId = profileData?.id;

                      // 1. Tạo phản ánh
                      if (reflection.createdAt) {
                        items.push({
                          time: reflection.createdAt,
                          label: "Tạo phản ánh",
                          description: `Cư dân ${reflection.user?.fullName || "Người dùng ẩn danh"} gửi phản ánh lên hệ thống.`,
                          icon: <Clock size={16} />,
                          color: "blue",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.userId,
                        });
                      }

                      // 2. Xác minh / Từ chối (Cán bộ tăng cường)
                      if (status === ReflectionStatus.REJECTED) {
                        items.push({
                          time: reflection.verifiedAt || reflection.updatedAt,
                          label: "Từ chối phản ánh",
                          description: `Cán bộ tăng cường ${reflection.officer?.fullName || ""} đã từ chối phản ánh. Lý do: ${reflection.rejectReason || "Không hợp lệ"}`,
                          icon: <XCircle size={16} />,
                          color: "red",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.officerId,
                        });
                      } else if (reflection.verifiedAt) {
                        items.push({
                          time: reflection.verifiedAt,
                          label: "Xác minh phản ánh",
                          description: `Cán bộ tăng cường ${reflection.officer?.fullName || ""} đã xác nhận phản ánh hợp lệ. Mức độ ưu tiên: ${getPriorityText(reflection.priority)}`,
                          icon: <ShieldCheck size={16} />,
                          color: "green",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.officerId,
                        });
                      }

                      // 3. Phân công xử lý (Quản lý giao cho Hậu kiểm)
                      if (reflection.assignedAt) {
                        items.push({
                          time: reflection.assignedAt,
                          label: "Phân công xử lý",
                          description: `Quản lý phường ${reflection.manager?.fullName || ""} đã phân công cho cán bộ Hậu kiểm ${reflection.inspector?.fullName || ""}.`,
                          icon: <UserCheck size={16} />,
                          color: "purple",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.inspectorId ||
                            currentUserId === reflection.managedBy,
                        });
                      }

                      // 4. Hậu kiểm nhận việc
                      if (reflection.inspectorAcceptedAt) {
                        items.push({
                          time: reflection.inspectorAcceptedAt,
                          label: "Hậu kiểm nhận việc",
                          description: `Cán bộ hậu kiểm ${reflection.inspector?.fullName || ""} đã xác nhận nhận nhiệm vụ.`,
                          icon: <ShieldCheck size={16} />,
                          color: "blue",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.inspectorId,
                        });
                      }

                      // 5. Điều động tuần tra (Hậu kiểm điều động Tuần tra)
                      if (reflection.dispatchedAt) {
                        items.push({
                          time: reflection.dispatchedAt,
                          label: "Điều động tuần tra",
                          description: `Cán bộ hậu kiểm ${reflection.inspector?.fullName || ""} đã điều động cán bộ tuần tra ${reflection.patrol?.fullName || ""} thực địa.`,
                          icon: <Compass size={16} />,
                          color: "orange",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.inspectorId ||
                            currentUserId === reflection.patrolId,
                        });
                      }

                      // 6. Tuần tra nhận việc / Đến hiện trường
                      if (reflection.patrolAcceptedAt) {
                        items.push({
                          time: reflection.patrolAcceptedAt,
                          label: "Nhận việc / Đến hiện trường",
                          description: `Cán bộ tuần tra ${reflection.patrol?.fullName || ""} đã nhận nhiệm vụ và có mặt tại hiện trường.`,
                          icon: <Compass size={16} />,
                          color: "orange",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.patrolId,
                        });
                      }

                      // 7. Tuần tra báo cáo kết quả
                      if (
                        reflection.status === ReflectionStatus.COMPLETED ||
                        reflection.status === ReflectionStatus.RESOLVED ||
                        reflection.patrolReport
                      ) {
                        const hasIncompleteReason =
                          !!reflection.incompleteReason;
                        items.push({
                          time: reflection.updatedAt,
                          label: hasIncompleteReason
                            ? "Báo cáo xử lý: Chưa hoàn thành"
                            : "Báo cáo xử lý: Đã hoàn thành",
                          description: hasIncompleteReason
                            ? `Cán bộ tuần tra ${reflection.patrol?.fullName || ""} báo cáo chưa hoàn thành xử lý. Lý do: ${reflection.incompleteReason}. Báo cáo chi tiết: ${reflection.patrolReport || "Không có mô tả"}`
                            : `Cán bộ tuần tra ${reflection.patrol?.fullName || ""} báo cáo hoàn thành xử lý sự cố. Báo cáo chi tiết: ${reflection.patrolReport || "Đã hoàn thành"}`,
                          icon: hasIncompleteReason ? (
                            <AlertTriangle
                              size={16}
                              className="text-amber-500"
                            />
                          ) : (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                          ),
                          color: hasIncompleteReason ? "orange" : "green",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.patrolId,
                        });
                      }

                      // 8. Xác nhận hoàn thành toàn bộ (Quản lý xác nhận)
                      if (
                        status === ReflectionStatus.RESOLVED &&
                        reflection.respondedAt
                      ) {
                        items.push({
                          time: reflection.respondedAt,
                          label: "Xác nhận hoàn thành",
                          description: `Quản lý phường ${reflection.manager?.fullName || ""} xác nhận sự cố đã hoàn thành toàn bộ.`,
                          icon: <CheckCircle2 size={16} />,
                          color: "green",
                          visible:
                            isAdminOrManager ||
                            currentUserId === reflection.managedBy ||
                            currentUserId === reflection.userId,
                        });
                      }

                      // Lọc các item được phép hiển thị cho tài khoản này
                      return items
                        .filter((item) => item.visible)
                        .sort(
                          (a, b) =>
                            new Date(a.time).getTime() -
                            new Date(b.time).getTime(),
                        );
                    };

                    const historyItems = getHistoryItems();

                    return (
                      <Card className="rounded-2xl shadow-sm border-slate-100 p-4">
                        {historyItems.length === 0 ? (
                          <Empty description="Chưa có lịch sử thao tác" />
                        ) : (
                          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
                            {historyItems.map((item, idx) => (
                              <div key={idx} className="flex gap-4 relative">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                    item.color === "red"
                                      ? "bg-red-50 text-red-500 border border-red-200"
                                      : item.color === "green"
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                        : item.color === "orange"
                                          ? "bg-amber-50 text-amber-500 border border-amber-200"
                                          : "bg-blue-50 text-blue-500 border border-blue-200"
                                  }`}
                                >
                                  {item.icon}
                                </div>
                                <div className="flex-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                    <span className="font-semibold text-slate-800 text-sm sm:text-base">
                                      {item.label}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <Clock size={12} />
                                      {dayjs(item.time).format(
                                        "HH:mm DD/MM/YYYY",
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 text-xs sm:text-sm m-0 leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })()}
                </div>
              ),
            },
          ]}
        />
      </div>
      {/* ── Action Modal ── */}
      <ReflectionActionModal
        modalType={modalType}
        open={modalType !== null}
        onCancel={closeModal}
        confirmLoading={isSubmitting}
        onOk={handleSubmit}
        inspectors={inspectors}
        patrols={patrols}
      />
      {/* ── Rate Modal ── */}
      <Modal
        title={
          <span className="text-lg font-bold text-slate-800">
            Đánh giá chất lượng xử lý sự cố
          </span>
        }
        open={isRateModalOpen}
        onCancel={() => setIsRateModalOpen(false)}
        confirmLoading={rateSubmitting}
        onOk={handleRateSubmit}
        okText="Gửi đánh giá"
        cancelText="Hủy"
        destroyOnClose
      >
        <div className="py-4 space-y-4 flex flex-col items-center">
          <div className="text-slate-500 text-sm text-center">
            Vui lòng chọn số sao tương ứng với mức độ hài lòng về chất lượng xử
            lý của cán bộ:
          </div>
          <Rate
            allowClear={false}
            value={rateValue}
            onChange={(val) => setRateValue(val)}
            className="text-amber-400 text-3xl!"
          />
          <div className="w-full">
            <span className="text-sm font-semibold text-slate-700 block mb-1">
              Ý kiến phản hồi (nếu có):
            </span>
            <Input.TextArea
              rows={3}
              placeholder="Nhập ý kiến đóng góp của bạn về quá trình xử lý sự cố..."
              value={rateComment}
              onChange={(e) => setRateComment(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
