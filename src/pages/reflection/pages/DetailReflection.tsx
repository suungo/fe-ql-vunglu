import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Empty,
  Image,
  Modal,
  Select,
  Spin,
  Switch,
  Tag,
  Typography,
  notification,
} from "antd";
import dayjs from "dayjs";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Send,
  ShieldCheck,
  Tag as TagIcon,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL } from "@/apis";
import { getProfileApi } from "@/pages/profile/api";
import {
  acceptByInspectorApi,
  acceptByPatrolApi,
  assignReflectionApi,
  dispatchPatrolApi,
  getReflectionApi,
  inspectorConfirmApi,
  submitPatrolReportApi,
  verifyReflectionApi,
} from "../api";
import { Category, EventType, Priority, ReflectionStatus } from "../enum";

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

// Fix Leaflet icon issue
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const { Title, Paragraph, Text } = Typography;

type ModalType = "REJECT" | "ASSIGN" | "DISPATCH" | "REPORT" | "CONFIRM" | null;

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

const getPriorityTag = (priority?: Priority) => {
  switch (priority) {
    case Priority.LOW:
      return <Tag color="green">Thấp</Tag>;
    case Priority.MEDIUM:
      return <Tag color="gold">Trung bình</Tag>;
    case Priority.HIGH:
      return <Tag color="red">Cao</Tag>;
    default:
      return <Tag color="default">Chưa xác định</Tag>;
  }
};

const getCategoryLabel = (cat?: Category) => {
  switch (cat) {
    case Category.INFRASTRUCTURE:
      return "Hạ tầng";
    case Category.ENVIRONMENT:
      return "Môi trường";
    case Category.SECURITY:
      return "An ninh trật tự";
    default:
      return "Khác";
  }
};

const getEventTypeLabel = (eventType?: EventType) => {
  switch (eventType) {
    case EventType.RAIN:
      return "Mưa";
    case EventType.TIDE:
      return "Thủy triều";
    case EventType.FLOOD:
      return "Lũ lụt";
    case EventType.DYKE_BREAK:
      return "Vỡ đê";
    case EventType.LANDSLIDE:
      return "Sạt lở";
    default:
      return "Khác";
  }
};

// ── Timeline helper ────────────────────────────────────────────────────────
const getTimelineSteps = (reflection: any) => {
  const status: ReflectionStatus = reflection?.status;
  const isRejected = status === ReflectionStatus.REJECTED;
  return [
    {
      key: "PENDING",
      title: "Gửi phản ánh",
      desc: "Hệ thống đã ghi nhận phản ánh.",
      active: true,
      error: false,
    },
    {
      key: "VERIFIED",
      title: isRejected ? "Từ chối" : "Xác minh thực địa",
      desc: isRejected
        ? `Lý do: ${reflection?.rejectReason || "Không hợp lệ"}`
        : "Cán bộ tăng cường đã xác minh sự cố.",
      active:
        isRejected ||
        [
          ReflectionStatus.VERIFIED,
          ReflectionStatus.ASSIGNED,
          ReflectionStatus.IN_PROGRESS,
          ReflectionStatus.COMPLETED,
          ReflectionStatus.RESOLVED,
        ].includes(status),
      error: isRejected,
    },
    {
      key: "ASSIGNED",
      title: "Phân công",
      desc: "Quản lý phường giao cho cán bộ Hậu kiểm.",
      active: [
        ReflectionStatus.ASSIGNED,
        ReflectionStatus.IN_PROGRESS,
        ReflectionStatus.COMPLETED,
        ReflectionStatus.RESOLVED,
      ].includes(status),
      error: false,
    },
    {
      key: "IN_PROGRESS",
      title: "Xử lý hiện trường",
      desc: `Cán bộ tuần tra thực hiện. ${reflection?.estimatedHandleMinutes ? `(Dự kiến: ${reflection.estimatedHandleMinutes} phút)` : ""}`,
      active: [
        ReflectionStatus.IN_PROGRESS,
        ReflectionStatus.COMPLETED,
        ReflectionStatus.RESOLVED,
      ].includes(status),
      error: false,
    },
    {
      key: "COMPLETED",
      title: "Báo cáo kết quả",
      desc: "Tuần tra báo cáo xong, chờ Hậu kiểm xác nhận.",
      active: [ReflectionStatus.COMPLETED, ReflectionStatus.RESOLVED].includes(
        status,
      ),
      error: false,
    },
    {
      key: "RESOLVED",
      title: "Hoàn thành",
      desc: "Hậu kiểm xác nhận. Sự cố cập nhật bản đồ.",
      active: status === ReflectionStatus.RESOLVED,
      error: false,
    },
  ];
};

// ══════════════════════════════════════════════════════════════════════════════
export default function DetailReflection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal inputs
  const [textInput, setTextInput] = useState("");
  const [extraInput, setExtraInput] = useState("");
  const [booleanInput, setBooleanInput] = useState(false); // needReinforcement
  const [resolvedInput, setResolvedInput] = useState(true); // patrol resolved?
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

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
    setTextInput("");
    setExtraInput("");
    setBooleanInput(false);
    setResolvedInput(true);
    setSelectedUserId(null);
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
  const handleSubmit = async () => {
    if (!id || !reflection) return;
    const rid = Number(id);
    setIsSubmitting(true);
    try {
      switch (modalType) {
        case "REJECT":
          if (!textInput.trim()) {
            notification.error({ message: "Vui lòng nhập lý do từ chối." });
            return;
          }
          await verifyReflectionApi(rid, {
            confirmed: false,
            rejectReason: textInput,
          });
          notification.success({ message: "Đã từ chối phản ánh." });
          break;
        case "ASSIGN":
          if (!selectedUserId) {
            notification.error({ message: "Vui lòng chọn cán bộ Hậu kiểm." });
            return;
          }
          await assignReflectionApi(rid, {
            inspectorId: selectedUserId,
            note: textInput || undefined,
          });
          notification.success({ message: "Đã phân công cho Hậu kiểm!" });
          break;
        case "DISPATCH":
          if (!selectedUserId) {
            notification.error({ message: "Vui lòng chọn cán bộ Tuần tra." });
            return;
          }
          const mins = Number(extraInput);
          if (!extraInput || isNaN(mins) || mins <= 0) {
            notification.error({
              message: "Vui lòng nhập thời gian xử lý dự kiến (phút).",
            });
            return;
          }
          await dispatchPatrolApi(rid, {
            patrolId: selectedUserId,
            estimatedHandleMinutes: mins,
            note: textInput || undefined,
          });
          notification.success({ message: "Đã điều động cán bộ Tuần tra!" });
          break;
        case "REPORT":
          if (!textInput.trim()) {
            notification.error({ message: "Vui lòng nhập nội dung báo cáo." });
            return;
          }
          if (!resolvedInput && !extraInput.trim()) {
            notification.error({
              message: "Vui lòng nhập lý do chưa hoàn thành.",
            });
            return;
          }
          await submitPatrolReportApi(rid, {
            resolved: resolvedInput,
            patrolReport: textInput,
            needReinforcement: booleanInput,
            incompleteReason: resolvedInput ? undefined : extraInput,
          });
          notification.success({ message: "Đã nộp báo cáo thực địa!" });
          break;
        case "CONFIRM":
          await inspectorConfirmApi(rid, { note: textInput || undefined });
          notification.success({
            message:
              "Đã xác nhận hoàn thành! Dữ liệu thiệt hại được tạo tự động.",
          });
          queryClient.invalidateQueries({ queryKey: ["floodDamages"] });
          break;
      }
      closeModal();
      refetch();
    } catch (err: any) {
      notification.error({
        message: "Thao tác thất bại",
        description: err?.response?.data?.message ?? "Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
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
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await verifyReflectionApi(Number(id), { confirmed: true });
                notification.success({
                  message: "Đã xác minh và chuyển lên Quản lý phường!",
                });
                refetch();
              } catch (err: any) {
                notification.error({
                  message: "Xác minh thất bại",
                  description: err?.response?.data?.message,
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
            loading={isSubmitting}
          >
            Xác minh hợp lệ
          </Button>
        </div>
      );
    }

    // MANAGER / ADMIN
    if (roleCode === "MANAGER" || roleCode === "ADMIN") {
      if (
        status === ReflectionStatus.PENDING ||
        status === ReflectionStatus.VERIFIED
      ) {
        return (
          <div className="mt-6">
            <Button
              type="primary"
              icon={<UserCheck size={15} />}
              size="large"
              block
              style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
              onClick={() => openModal("ASSIGN")}
            >
              Phân công cho Hậu kiểm
            </Button>
          </div>
        );
      }
      if (
        status === ReflectionStatus.ASSIGNED &&
        !reflection.inspectorAcceptedAt &&
        reflection.assignedAt
      ) {
        return (
          <div className="mt-6 flex flex-col items-center gap-3 border p-4 rounded-xl bg-slate-50">
            <div className="text-sm text-slate-500">
              Đang chờ Hậu kiểm nhận việc...
            </div>
            <CountdownTimer targetDate={reflection.assignedAt} />
            <Button
              type="primary"
              size="large"
              block
              style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
              onClick={() => openModal("ASSIGN")}
            >
              Phân công lại Hậu kiểm
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
                      message: "Đã nhận việc thành công!",
                    });
                    refetch();
                  } catch (err: any) {
                    notification.error({
                      message: "Lỗi",
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
            <CountdownTimer targetDate={reflection.dispatchedAt} />
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
      if (!reflection.patrolAcceptedAt && reflection.dispatchedAt) {
        return (
          <div className="mt-6 flex flex-col items-center gap-3 border border-blue-100 p-4 rounded-xl bg-blue-50">
            <div className="text-sm font-bold text-blue-700">
              Bạn có 5 phút để nhận việc:
            </div>
            <CountdownTimer targetDate={reflection.dispatchedAt} />
            <Button
              type="primary"
              size="large"
              block
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await acceptByPatrolApi(Number(id));
                  notification.success({ message: "Đã nhận việc thành công!" });
                  refetch();
                } catch (err: any) {
                  notification.error({
                    message: "Lỗi",
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
      } else if (reflection.patrolAcceptedAt) {
        return (
          <div className="mt-6">
            <Button
              type="primary"
              icon={<Send size={15} />}
              size="large"
              block
              style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
              onClick={() => openModal("REPORT")}
            >
              Nộp báo cáo thực địa
            </Button>
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

    return null;
  };

  // ── Modal content by type ─────────────────────────────────────────────────
  const getModalConfig = () => {
    switch (modalType) {
      case "REJECT":
        return {
          title: (
            <span className="text-red-600 flex items-center gap-2">
              <XCircle size={18} /> Từ chối phản ánh
            </span>
          ),
          content: (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Nhập lý do từ chối để thông báo đến người dân.
              </p>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 bg-slate-50"
                rows={4}
                placeholder="Nhập lý do từ chối..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>
          ),
        };
      case "ASSIGN":
        return {
          title: (
            <span className="text-purple-600 flex items-center gap-2">
              <UserCheck size={18} /> Phân công Hậu kiểm
            </span>
          ),
          content: (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  Chọn cán bộ Hậu kiểm <span className="text-red-500">*</span>
                </label>
                <Select
                  placeholder="Chọn Hậu kiểm..."
                  className="w-full"
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  options={inspectors.map((u) => ({
                    value: u.id,
                    label: u.fullName,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  Ghi chú (Tùy chọn)
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50"
                  rows={3}
                  placeholder="Ghi chú cho Hậu kiểm..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
            </div>
          ),
        };
      case "DISPATCH":
        return {
          title: (
            <span className="text-blue-600 flex items-center gap-2">
              <Compass size={18} /> Điều động cán bộ Tuần tra
            </span>
          ),
          content: (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  Chọn cán bộ Tuần tra <span className="text-red-500">*</span>
                </label>
                <Select
                  placeholder="Chọn Tuần tra..."
                  className="w-full"
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  options={patrols.map((u) => ({
                    value: u.id,
                    label: u.fullName,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  Thời gian xử lý dự kiến (phút){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
                  placeholder="VD: 30"
                  value={extraInput}
                  onChange={(e) => setExtraInput(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  Ghi chú (Tùy chọn)
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
                  rows={2}
                  placeholder="Ghi chú cho cán bộ tuần tra..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
            </div>
          ),
        };
      case "REPORT":
        return {
          title: (
            <span className="text-sky-600 flex items-center gap-2">
              <Send size={18} /> Báo cáo kết quả thực địa
            </span>
          ),
          content: (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Đã xử lý xong?
                  </p>
                  <p className="text-xs text-slate-400">
                    Bật nếu sự cố đã được khắc phục hoàn toàn
                  </p>
                </div>
                <Switch checked={resolvedInput} onChange={setResolvedInput} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  Nội dung báo cáo <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
                  rows={4}
                  placeholder="Mô tả tình trạng hiện trường và kết quả xử lý..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
              {!resolvedInput && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">
                    Lý do chưa hoàn thành{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50"
                    rows={2}
                    placeholder="Nêu lý do chưa xử lý xong..."
                    value={extraInput}
                    onChange={(e) => setExtraInput(e.target.value)}
                  />
                </div>
              )}
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <Switch checked={booleanInput} onChange={setBooleanInput} />
                <div>
                  <p className="text-sm font-bold text-red-700">
                    Cần tiếp viện?
                  </p>
                  <p className="text-xs text-red-400">
                    Bật nếu tình huống vượt quá khả năng xử lý
                  </p>
                </div>
              </div>
            </div>
          ),
        };
      case "CONFIRM":
        return {
          title: (
            <span className="text-emerald-600 flex items-center gap-2">
              <CheckCircle2 size={18} /> Xác nhận hoàn thành sự cố
            </span>
          ),
          content: (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <p className="text-sm text-emerald-700">
                  Xác nhận sẽ: đánh dấu phản ánh là <strong>RESOLVED</strong>,
                  tự động tạo bản ghi thiệt hại (FloodDamage), và gửi thông báo
                  đến tất cả bên liên quan.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">
                  Ghi chú xác nhận (Tùy chọn)
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  rows={3}
                  placeholder="Ghi chú của Hậu kiểm..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
            </div>
          ),
        };
      default:
        return null;
    }
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

  const modalConfig = getModalConfig();

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeft size={20} />}
            onClick={() => navigate(-1)}
            className="hover:bg-slate-100 rounded-full"
          />
          <div>
            <Title level={3} className="mb-1!">
              Chi tiết phản ánh
            </Title>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Clock size={14} />
              <span>
                Gửi lúc:{" "}
                {dayjs(reflection.createdAt).format("HH:mm DD/MM/YYYY")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusTag(reflection.status)}
          {reflection.status === ReflectionStatus.PENDING &&
            (roleCode === "MANAGER" ||
              roleCode === "ADMIN" ||
              roleCode === "RESIDENT") && (
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/app/reflection-manager/edit/${reflection.id}`)
                }
              >
                Chỉnh sửa
              </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
            <div className="space-y-4">
              <div>
                <Title level={4} className="text-slate-800!">
                  {reflection.title ?? reflection.content}
                </Title>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <TagIcon size={16} className="text-blue-500" />
                    <span>{getCategoryLabel(reflection.category)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span className="flex gap-1">
                      Mức độ: {getPriorityTag(reflection.priority)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <AlertTriangle size={16} className="text-orange-500" />
                    <span>
                      Loại: {getEventTypeLabel(reflection.typeOfIncident)}
                    </span>
                  </div>
                </div>
              </div>

              <Divider className="my-4!" />

              <div>
                <Text strong className="block mb-2 text-slate-700">
                  Mô tả chi tiết:
                </Text>
                <Paragraph className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">
                  {reflection.description || "Không có mô tả chi tiết."}
                </Paragraph>
              </div>

              {reflection.imageUrl && reflection.imageUrl.length > 0 && (
                <div className="mt-6">
                  <Text strong className="block mb-3 text-slate-700">
                    Hình ảnh / Video đính kèm:
                  </Text>
                  <div className="flex flex-wrap gap-4">
                    <Image.PreviewGroup>
                      {reflection.imageUrl.map((url: string, idx: number) => {
                        const isVideo =
                          url.match(/\.(mp4|webm|ogg|mov|avi|flv|wmv)$/i) ||
                          url.includes("/video/upload/") ||
                          url.startsWith("data:video/");
                        return (
                          <div
                            key={idx}
                            className="relative group overflow-hidden rounded-xl border border-slate-100 h-40 w-40 sm:h-48 sm:w-48 bg-slate-50 flex items-center justify-center"
                          >
                            {isVideo ? (
                              <video
                                src={url}
                                controls
                                muted
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <Image
                                src={url}
                                alt={`Attachment ${idx}`}
                                className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105"
                                fallback="https://via.placeholder.com/400?text=Error+Loading+Image"
                              />
                            )}
                          </div>
                        );
                      })}
                    </Image.PreviewGroup>
                  </div>
                </div>
              )}

              {/* Báo cáo tuần tra */}
              {reflection.patrolReport && (
                <div className="mt-4 bg-sky-50 border border-sky-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text strong className="text-sky-800">
                      👷 Báo cáo từ cán bộ Tuần tra
                    </Text>
                    {reflection.needReinforcement && (
                      <Tag color="red">Cần tiếp viện</Tag>
                    )}
                  </div>
                  <Paragraph className="text-sky-700 text-sm whitespace-pre-wrap mb-1">
                    {reflection.patrolReport}
                  </Paragraph>
                  {reflection.patrolLat && (
                    <Text className="text-xs text-sky-500">
                      📍 GPS: {reflection.patrolLat?.toFixed(5)},{" "}
                      {reflection.patrolLng?.toFixed(5)}
                    </Text>
                  )}
                </div>
              )}

              {/* Ghi chú điều hành */}
              {reflection.response && (
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <Text strong className="text-slate-700 block mb-1">
                    ✍️ Ghi chú điều hành / Phản hồi:
                  </Text>
                  <Paragraph className="text-slate-600 text-sm">
                    {reflection.response}
                  </Paragraph>
                </div>
              )}

              {/* Lý do từ chối */}
              {reflection.rejectReason && (
                <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
                  <Text strong className="text-red-700 block mb-1">
                    ❌ Lý do từ chối:
                  </Text>
                  <Paragraph className="text-red-600 text-sm">
                    {reflection.rejectReason}
                  </Paragraph>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card
            title="Tiến độ xử lý phản ánh"
            className="rounded-2xl shadow-sm border-slate-100"
          >
            <div className="space-y-0">
              {getTimelineSteps(reflection).map((step, idx, arr) => (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${step.error ? "bg-red-500" : step.active ? "bg-blue-500" : "bg-slate-200"}`}
                    />
                    {idx < arr.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${step.error ? "bg-red-200" : step.active ? "bg-blue-200" : "bg-slate-100"}`}
                        style={{ minHeight: 24 }}
                      />
                    )}
                  </div>
                  <div className="pb-5 flex-1">
                    <Text
                      strong
                      className={`text-sm ${step.error ? "text-red-600" : step.active ? "text-slate-900" : "text-slate-400"}`}
                    >
                      {step.title}
                    </Text>
                    <Paragraph
                      className={`text-xs mt-0.5 mb-0 ${step.error ? "text-red-500" : step.active ? "text-slate-500" : "text-slate-300"}`}
                    >
                      {step.desc}
                    </Paragraph>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Map */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                <span>Vị trí phản ánh</span>
              </div>
            }
            className="rounded-2xl shadow-sm border-slate-100 overflow-hidden"
          >
            <div className="mb-4 text-slate-600 flex items-start gap-2">
              <MapPin size={16} className="mt-1 shrink-0" />
              <span>
                {reflection.address || `${reflection.lat}, ${reflection.lng}`}
              </span>
            </div>
            <div className="h-80 rounded-xl overflow-hidden border border-slate-100">
              {reflection.lat && reflection.lng ? (
                <MapContainer
                  center={[reflection.lat, reflection.lng]}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[reflection.lat, reflection.lng]}>
                    <Popup>{reflection.address}</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50">
                  <Text type="secondary">Không có thông tin tọa độ</Text>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Người gửi */}
          <Card className="rounded-2xl shadow-sm border-slate-100">
            <Title level={5} className="mb-4!">
              Thông tin bổ sung
            </Title>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Người gửi</div>
                  <div className="font-medium text-slate-700">
                    {reflection.user?.fullName ||
                      reflection.user?.username ||
                      "Người dùng ẩn danh"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Ngày cập nhật</div>
                  <div className="font-medium text-slate-700">
                    {dayjs(reflection.updatedAt).format("HH:mm DD/MM/YYYY")}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Panel */}
          <Card className="rounded-2xl shadow-sm border-slate-100">
            <Title level={5} className="mb-3!">
              Hành động
            </Title>
            {renderActionPanel() ?? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck size={28} className="text-slate-300" />
                </div>
                <Text type="secondary" className="text-sm">
                  {status === ReflectionStatus.RESOLVED
                    ? "Phản ánh đã được xử lý hoàn thành."
                    : status === ReflectionStatus.REJECTED
                      ? "Phản ánh đã bị từ chối."
                      : "Không có hành động khả dụng cho role của bạn."}
                </Text>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Action Modal ── */}
      {modalConfig && (
        <Modal
          title={modalConfig.title}
          open={modalType !== null}
          onCancel={closeModal}
          confirmLoading={isSubmitting}
          onOk={handleSubmit}
          okText="Xác nhận"
          cancelText="Hủy"
          okButtonProps={{
            danger: modalType === "REJECT",
            style:
              modalType !== "REJECT"
                ? { backgroundColor: "#2563eb", borderColor: "#2563eb" }
                : undefined,
          }}
          width={520}
        >
          {modalConfig.content}
        </Modal>
      )}
    </div>
  );
}
