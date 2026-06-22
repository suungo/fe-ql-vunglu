import { Role } from "@/enums";
import { useSearchParams } from "react-router-dom";
import { getProfileApi } from "@/pages/profile/api";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  List,
  Modal,
  Select,
  Spin,
  Tag,
  Tooltip,
  notification,
  Input,
  Tabs,
  Form,
  DatePicker,
  Table,
} from "antd";
import dayjs from "dayjs";
import {
  ArrowRightLeft,
  Check,
  CheckCircle,
  Eye,
  FileText,
  RefreshCw,
  Send,
  User,
  UserCheck,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  MapPin,
  Clock,
  Timer,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  DispatchReportStatus,
  DispatchReportType,
  type DispatchReport,
} from "../interfaces";
import {
  useDispatchReports,
  useVerifiedReflections,
  useStaffList,
  useCreateDispatchToInspector,
  useCreateDispatchToPatrol,
  useAcceptDispatch,
  useUpdateDispatchReport,
  useDispatchSocket,
  useNudgeDispatch,
} from "../hooks";
import { DispatchItemCard } from "../components/DispatchItemCard";
import { DispatchTable } from "../components/DispatchTable";
import { CreateDispatchModal } from "../components/CreateDispatchModal";
import { Priority } from "@/pages/reflection/enum";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const incidentIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const patrolIcon = L.divIcon({
  className: "custom-patrol-marker",
  html: '<div style="width:28px;height:28px;background:#0ea5e9;border-radius:50%;border:4px solid #fff;box-shadow:0 2px 12px rgba(14,165,233,0.5);position:relative"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:8px;height:8px;background:#fff;border-radius:50%"></div></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -18],
});

const RoutingPath = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!from[0] || !from[1] || !to[0] || !to[1]) return;

    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [
            c[1],
            c[0],
          ]);
          setRoute(coords);
          setRouteInfo({
            distance: data.routes[0].distance,
            duration: data.routes[0].duration,
          });
        } else {
          setRoute([from, to]);
          setRouteInfo(null);
        }
      })
      .catch(() => {
        setRoute([from, to]);
        setRouteInfo(null);
      });
  }, [from[0], from[1], to[0], to[1]]);

  if (route.length === 0) return null;

  const middleIndex = Math.floor(route.length / 2);
  const middlePoint = route[middleIndex];

  return (
    <>
      <Polyline positions={route} color="#0ea5e9" weight={5} opacity={0.8} />
      {routeInfo && middlePoint && (
        <Marker
          position={middlePoint}
          icon={L.divIcon({
            className: "dummy-route-info",
            html: `<div style="background: white; padding: 4px 8px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: nowrap; font-weight: bold; color: #0ea5e9; font-size: 12px; margin-top: -10px; margin-left: -20px;">
              ${(routeInfo.distance / 1000).toFixed(1)} km - ${Math.round(routeInfo.duration / 60)} phút
            </div>`,
            iconSize: [0, 0],
          })}
        />
      )}
    </>
  );
};

const RecenterMap = ({
  incidentCoords,
  patrolCoords,
}: {
  incidentCoords: [number, number];
  patrolCoords?: [number, number] | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (patrolCoords && patrolCoords[0] && patrolCoords[1]) {
      const bounds = L.latLngBounds([incidentCoords, patrolCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(incidentCoords, 15);
    }
  }, [
    incidentCoords[0],
    incidentCoords[1],
    patrolCoords?.[0],
    patrolCoords?.[1],
    map,
  ]);

  return null;
};

const { TextArea } = Input;

export default function ListDispatch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initReflectionId = searchParams.get("reflectionId")
    ? Number(searchParams.get("reflectionId"))
    : null;

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(!!initReflectionId);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] =
    useState<DispatchReport | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const [reportForm] = Form.useForm();

  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current.isBefore(dayjs().startOf("day"));
  };

  const statusFilter = useMemo(() => {
    if (activeTab === "ALL") return undefined;
    return activeTab as DispatchReportStatus;
  }, [activeTab]);

  // 1. Tải danh sách điều chuyển (Sử dụng Hook mới)
  const {
    data: dispatches,
    isLoading,
    refetch,
  } = useDispatchReports({
    page,
    limit,
    status: statusFilter,
    search: debouncedSearch || undefined,
  });

  // Tải profile của user
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const roleCode = profileData?.role?.roleCode;
  const canSeeRoute = roleCode === Role.MANAGER || roleCode === Role.PATROL;
  const isSystemManager = roleCode === Role.ADMIN || roleCode === Role.MANAGER;
  const titleText = "yêu cầu tuần tra";
  const canCreate = roleCode === Role.ADMIN || roleCode === Role.MANAGER;

  // 2. Tải danh sách phản ánh & cán bộ cho form tạo (Chỉ khi modal mở - Tối ưu hóa API load)
  const staffRole = "PATROL";
  const reflectionStatusParam = "VERIFIED";
  const { data: reflectionsData } = useVerifiedReflections(
    reflectionStatusParam,
    isCreateModalOpen,
  );
  const { data: staffListData } = useStaffList(staffRole, isCreateModalOpen);

  const reflectionList = reflectionsData?.data || [];
  const staffList = staffListData?.data || [];

  // 3. Đăng ký Socket real-time (Sử dụng Hook mới)
  const handlePatrolLocationUpdate = useCallback(
    (data: { id: number; lat: number; lng: number }) => {
      setSelectedDispatch((prev) => {
        if (!prev) return null;
        if (prev.reflectionId === data.id || prev.reflection?.id === data.id) {
          return {
            ...prev,
            reflection: prev.reflection
              ? {
                  ...prev.reflection,
                  patrolLat: data.lat,
                  patrolLng: data.lng,
                }
              : undefined,
          } as DispatchReport;
        }
        return prev;
      });
    },
    [],
  );

  useDispatchSocket(refetch, handlePatrolLocationUpdate);

  // Đồng bộ selectedDispatch khi danh sách dispatches được làm mới (real-time)
  useEffect(() => {
    if (!selectedDispatch) return;
    const updated = dispatches?.data?.find((d) => d.id === selectedDispatch.id);
    if (updated) {
      setSelectedDispatch((prev) => {
        if (!prev) return null;
        // Giữ lại toạ độ GPS realtime nếu đang có
        const patrolLat =
          prev.reflection?.patrolLat ?? updated.reflection?.patrolLat;
        const patrolLng =
          prev.reflection?.patrolLng ?? updated.reflection?.patrolLng;
        return {
          ...updated,
          reflection: updated.reflection
            ? {
                ...updated.reflection,
                patrolLat,
                patrolLng,
              }
            : undefined,
        } as DispatchReport;
      });
    }
  }, [dispatches?.data, selectedDispatch?.id]);

  // 4. Mutations cho các tác vụ thay đổi dữ liệu (Sử dụng Hook mới)
  const createInspectorMutation = useCreateDispatchToInspector();
  const createPatrolMutation = useCreateDispatchToPatrol();
  const acceptMutation = useAcceptDispatch();
  const updateReportMutation = useUpdateDispatchReport();
  const nudgeMutation = useNudgeDispatch();

  // ── HELPERS ──────────────────────────────────────────────────────────

  const getStatusTag = (status: DispatchReportStatus) => {
    const map: Record<
      DispatchReportStatus,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      [DispatchReportStatus.PENDING]: {
        color: "orange",
        icon: <Clock size={12} />,
        label: "Chờ xử lý",
      },
      [DispatchReportStatus.ACCEPTED]: {
        color: "cyan",
        icon: <CheckCircle size={12} />,
        label: "Đã xác nhận",
      },
      [DispatchReportStatus.REJECTED]: {
        color: "red",
        icon: <XCircle size={12} />,
        label: "Từ chối",
      },
      [DispatchReportStatus.EXPIRED]: {
        color: "default",
        icon: <Timer size={12} />,
        label: "Hết hạn",
      },
      [DispatchReportStatus.IN_PROGRESS]: {
        color: "processing",
        icon: <RefreshCw size={12} />,
        label: "Đang xử lý",
      },
      [DispatchReportStatus.COMPLETED]: {
        color: "green",
        icon: <Check size={12} />,
        label: "Hoàn thành",
      },
      [DispatchReportStatus.CANCELLED]: {
        color: "default",
        icon: <XCircle size={12} />,
        label: "Đã hủy",
      },
    };
    const config = map[status] || {
      color: "default",
      icon: null,
      label: status,
    };
    return (
      <Tag
        color={config.color}
        icon={config.icon}
        className="flex items-center gap-1"
      >
        {config.label}
      </Tag>
    );
  };

  const getTypeTag = (type: DispatchReportType) => {
    return <Tag color="blue">Yêu cầu tuần tra</Tag>;
  };

  // ── XỬ LÝ TẠO ĐIỀU CHUYỂN ──────────────────────────────────────────

  const handleCreate = async (values: any) => {
    const data = {
      reflectionId: values.reflectionId,
      assignedTo:
        values.assignedTo === "OTHER"
          ? undefined
          : values.assignedTo || undefined,
      customHandler:
        values.assignedTo === "OTHER" ? values.customHandler : undefined,
      expectedTime: values.expectedTime
        ? values.expectedTime.toISOString()
        : undefined,
      description: values.description || undefined,
      title: undefined,
      note: undefined,
    };
    // Luồng mới: luôn tạo yêu cầu cho PATROL
    const mutation = createPatrolMutation;

    mutation.mutate(data, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: `Tạo ${titleText} thành công!`,
        });
        setIsCreateModalOpen(false);
        resetCreateForm();
      },
      onError: (err: any) => {
        notification.error({
          message: "Thất bại",
          description:
            err?.response?.data?.message || `Không thể tạo ${titleText}`,
        });
      },
    });
  };

  const resetCreateForm = () => {
    setSearchParams({});
  };

  // ── XÁC NHẬN NHẬN VIỆC ─────────────────────────────────────────────

  const handleAccept = async (id: number) => {
    acceptMutation.mutate(id, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã xác nhận nhận việc!",
        });
        setIsDetailModalOpen(false);
      },
      onError: (err: any) => {
        notification.error({
          message: "Thất bại",
          description: err?.response?.data?.message || "Không thể xác nhận",
        });
      },
    });
  };

  // ── CẬP NHẬT BÁO CÁO ──────────────────────────────────────────────

  const handleUpdateReport = async (values: any) => {
    if (!selectedDispatch) return;
    updateReportMutation.mutate(
      {
        id: selectedDispatch.id,
        data: {
          reportContent: values.reportContent || undefined,
          reflectionStatusUpdate: values.reflectionStatusUpdate || undefined,
          expectedTime: values.expectedTime
            ? values.expectedTime.toISOString()
            : undefined,
          status: DispatchReportStatus.COMPLETED,
        },
      },
      {
        onSuccess: () => {
          notification.success({
            message: "Thành công",
            description: "Đã cập nhật báo cáo!",
          });
          setIsReportModalOpen(false);
          reportForm.resetFields();
        },
        onError: (err: any) => {
          notification.error({
            message: "Thất bại",
            description: err?.response?.data?.message || "Không thể cập nhật",
          });
        },
      },
    );
  };

  const handleNudge = (id: number) => {
    nudgeMutation.mutate(id, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã gửi yêu cầu thúc giục cán bộ xử lý!",
        });
      },
      onError: (err: any) => {
        notification.error({
          message: "Thất bại",
          description:
            err?.response?.data?.message || "Không thể gửi thúc giục",
        });
      },
    });
  };

  // ── RENDER ──────────────────────────────────────────────────────────

  // Render variables already declared above

  const isMutationLoading =
    createInspectorMutation.isPending ||
    createPatrolMutation.isPending ||
    acceptMutation.isPending ||
    updateReportMutation.isPending ||
    nudgeMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 p-4 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Danh sách {titleText}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button
                type="primary"
                className="flex items-center gap-1"
                onClick={() => {
                  setIsCreateModalOpen(true);
                }}
              >
                <Plus size={16} />
                Thêm mới
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Input
            placeholder="Tìm kiếm theo mã, tiêu đề, mô tả..."
            prefix={<Search className="text-[#484848]" size={16} />}
            className="h-8! w-[250px]!"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            allowClear
          />
          <Tooltip title="Làm mới">
            <RefreshCw
              size={20}
              className={`cursor-pointer text-slate-400 hover:text-blue-500 transition ${isLoading ? "animate-spin" : ""}`}
              onClick={() => refetch()}
            />
          </Tooltip>
        </div>
        {/* Tabs lọc trạng thái */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPage(1);
          }}
          items={[
            {
              key: "ALL",
              label: <span className="font-medium text-[16px]">Tất cả</span>,
            },
            {
              key: DispatchReportStatus.PENDING,
              label: <span className="font-medium text-[16px]">Chờ xử lý</span>,
            },
            // {
            //   key: DispatchReportStatus.ACCEPTED,
            //   label: (
            //     <span className="font-medium text-[16px]">Đã xác nhận</span>
            //   ),
            // },
            {
              key: DispatchReportStatus.IN_PROGRESS,
              label: (
                <span className="font-medium text-[16px]">Đang xử lý</span>
              ),
            },
            {
              key: DispatchReportStatus.COMPLETED,
              label: (
                <span className="font-medium text-[16px]">Hoàn thành</span>
              ),
            },
            {
              key: DispatchReportStatus.EXPIRED,
              label: <span className="font-medium text-[16px]">Hết hạn</span>,
            },
          ]}
          className="mb-2"
        />

        {/* Danh sách */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <div className="mt-4">
            <DispatchTable
              dataSource={dispatches?.data || []}
              loading={isLoading}
              page={page}
              limit={limit}
              total={dispatches?.meta?.total || 0}
              onPageChange={(p) => setPage(p)}
              onViewDetail={(record) => {
                setSelectedDispatch(record);
                setIsDetailModalOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {/* ══════════ MODAL CHI TIẾT ══════════ */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span>Chi tiết yêu cầu</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        afterOpenChange={(open) => setShowMap(open)}
        width={700}
        destroyOnClose={true}
        footer={
          selectedDispatch ? (
            <div className="flex justify-end gap-2">
              {/* Nút xác nhận nhận việc (PATROL khi PENDING) */}
              {selectedDispatch.status === DispatchReportStatus.PENDING &&
                selectedDispatch.assignedTo === profileData?.id &&
                roleCode === Role.PATROL && (
                  <Button
                    type="primary"
                    onClick={() => handleAccept(selectedDispatch.id)}
                    loading={isMutationLoading}
                  >
                    Xác nhận nhận việc
                  </Button>
                )}
              {/* Nút cập nhật báo cáo (PATROL khi ACCEPTED) */}
              {selectedDispatch.status === DispatchReportStatus.ACCEPTED &&
                selectedDispatch.assignedTo === profileData?.id &&
                roleCode === Role.PATROL && (
                  <Button
                    type="primary"
                    onClick={() => {
                      reportForm.setFieldsValue({
                        reportContent: selectedDispatch.reportContent || "",
                        reflectionStatusUpdate:
                          selectedDispatch.reflectionStatusUpdate || "",
                        expectedTime: selectedDispatch.expectedTime
                          ? dayjs(selectedDispatch.expectedTime)
                          : null,
                      });
                      setIsReportModalOpen(true);
                    }}
                  >
                    Cập nhật báo cáo
                  </Button>
                )}
              {/* Nút Thúc giục (cho MANAGER, ADMIN khi PENDING, ACCEPTED, hoặc IN_PROGRESS) */}
              {(roleCode === Role.MANAGER || roleCode === Role.ADMIN) &&
                [
                  DispatchReportStatus.PENDING,
                  DispatchReportStatus.ACCEPTED,
                  DispatchReportStatus.IN_PROGRESS,
                ].includes(selectedDispatch.status) && (
                  <Button
                    type="default"
                    danger
                    onClick={() => handleNudge(selectedDispatch.id)}
                    loading={nudgeMutation.isPending}
                  >
                    Thúc giục cán bộ
                  </Button>
                )}
              <Button onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>
            </div>
          ) : null
        }
      >
        {selectedDispatch && (
          <div className="space-y-5 py-2">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  {selectedDispatch.title || `Biên bản ${titleText}`}
                </h3>
                <div className="text-sm text-slate-500">
                  Mã:{" "}
                  <span className="font-mono text-purple-600 font-bold">
                    {selectedDispatch.code}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {getStatusTag(selectedDispatch.status)}
                {getTypeTag(selectedDispatch.type)}
              </div>
            </div>

            {/* Người giao & nhận */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Người giao
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700">
                      {selectedDispatch.assigner?.fullName || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedDispatch.assigner?.phoneNumber || ""}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Người nhận
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700">
                      {selectedDispatch.assignee?.fullName ||
                        selectedDispatch.customHandler ||
                        "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedDispatch.assignee?.phoneNumber ||
                        (selectedDispatch.customHandler
                          ? "Xử lý ngoài hệ thống"
                          : "")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phản ánh gốc */}
            {selectedDispatch.reflection && (
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Phản ánh gốc
                </span>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="font-semibold text-amber-900">
                    #{selectedDispatch.reflectionId} —{" "}
                    {selectedDispatch.reflection.title}
                  </div>
                  <div className="text-sm text-amber-800 mt-1 line-clamp-2">
                    {selectedDispatch.reflection.content}
                  </div>
                  {selectedDispatch.reflection.address && (
                    <div className="text-xs text-amber-600 mt-1">
                      {selectedDispatch.reflection.address}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bản đồ theo dõi thời gian thực */}
            {showMap &&
              selectedDispatch.reflection &&
              selectedDispatch.reflection.lat &&
              selectedDispatch.reflection.lng && (
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Bản đồ theo dõi thời gian thực
                  </span>
                  <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
                    <MapContainer
                      center={[
                        selectedDispatch.reflection.lat,
                        selectedDispatch.reflection.lng,
                      ]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <RecenterMap
                        incidentCoords={[
                          selectedDispatch.reflection.lat,
                          selectedDispatch.reflection.lng,
                        ]}
                        patrolCoords={
                          canSeeRoute &&
                          selectedDispatch.reflection.patrolLat &&
                          selectedDispatch.reflection.patrolLng
                            ? [
                                selectedDispatch.reflection.patrolLat,
                                selectedDispatch.reflection.patrolLng,
                              ]
                            : null
                        }
                      />
                      {/* Điểm sự cố */}
                      <Marker
                        position={[
                          selectedDispatch.reflection.lat,
                          selectedDispatch.reflection.lng,
                        ]}
                        icon={incidentIcon}
                      >
                        <Popup>
                          <div>
                            <strong>Điểm sự cố</strong>
                            <p className="text-xs text-slate-500 m-0">
                              {selectedDispatch.reflection.address || ""}
                            </p>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Lộ trình đường đi thực tế */}
                      {canSeeRoute &&
                        selectedDispatch.reflection.patrolLat &&
                        selectedDispatch.reflection.patrolLng && (
                          <RoutingPath
                            from={[
                              selectedDispatch.reflection.patrolLat,
                              selectedDispatch.reflection.patrolLng,
                            ]}
                            to={[
                              selectedDispatch.reflection.lat,
                              selectedDispatch.reflection.lng,
                            ]}
                          />
                        )}

                      {/* Vị trí cán bộ tuần tra */}
                      {canSeeRoute &&
                        selectedDispatch.reflection.patrolLat &&
                        selectedDispatch.reflection.patrolLng && (
                          <Marker
                            position={[
                              selectedDispatch.reflection.patrolLat,
                              selectedDispatch.reflection.patrolLng,
                            ]}
                            icon={patrolIcon}
                          >
                            <Popup>
                              <div>
                                <strong>
                                  Cán bộ tuần tra:{" "}
                                  {selectedDispatch.assignee?.fullName || ""}
                                </strong>
                                <p className="text-xs text-slate-500 m-0">
                                  Vị trí hiện tại
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                    </MapContainer>
                  </div>
                  {canSeeRoute && (
                    selectedDispatch.reflection.patrolLat &&
                    selectedDispatch.reflection.patrolLng ? (
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />
                        Đang nhận tín hiệu GPS trực tuyến của{" "}
                        <strong>
                          {selectedDispatch.assignee?.fullName || "cán bộ"}
                        </strong>
                        .
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-1">
                        Chưa nhận được tín hiệu GPS từ cán bộ tuần tra.
                      </div>
                    )
                  )}
                </div>
              )}

            {/* Mô tả */}
            {selectedDispatch.description && (
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Mô tả chi tiết
                </span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap">
                  {selectedDispatch.description}
                </div>
              </div>
            )}

            {/* Ghi chú */}
            {selectedDispatch.note && (
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Ghi chú
                </span>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                  {selectedDispatch.note}
                </div>
              </div>
            )}

            {/* Biên bản báo cáo */}
            {selectedDispatch.reportContent && (
              <div>
                <span className="block text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                  📋 Biên bản báo cáo
                </span>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-slate-700 whitespace-pre-wrap">
                  {selectedDispatch.reportContent}
                </div>
                {selectedDispatch.reflectionStatusUpdate && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Trạng thái phản ánh:
                    </span>
                    <Tag color="green">
                      {selectedDispatch.reflectionStatusUpdate}
                    </Tag>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══════════ MODAL TẠO ĐIỀU CHUYỂN ══════════ */}
      <CreateDispatchModal
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          resetCreateForm();
        }}
        loading={isMutationLoading}
        onCreate={handleCreate}
        reflectionList={reflectionList}
        staffList={staffList}
        initReflectionId={initReflectionId}
      />

      {/* ══════════ MODAL CẬP NHẬT BÁO CÁO ══════════ */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-green-600" />
            <span>Cập nhật biên bản báo cáo</span>
          </div>
        }
        open={isReportModalOpen}
        onCancel={() => {
          setIsReportModalOpen(false);
          reportForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsReportModalOpen(false);
              reportForm.resetFields();
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isMutationLoading}
            onClick={() => reportForm.submit()}
            style={{ backgroundColor: "#059669" }}
            icon={<Check size={14} />}
          >
            Hoàn thành báo cáo
          </Button>,
        ]}
      >
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={handleUpdateReport}
          className="py-2"
        >
          <Form.Item
            name="reflectionStatusUpdate"
            label={
              <span className="text-xs font-bold text-slate-600">
                Trạng thái phản ánh{" "}
                {selectedDispatch?.type ===
                  DispatchReportType.INSPECTOR_TO_PATROL && (
                  <span className="text-red-500">* (Bắt buộc)</span>
                )}
              </span>
            }
            rules={
              selectedDispatch?.type === DispatchReportType.INSPECTOR_TO_PATROL
                ? [
                    {
                      required: true,
                      message: "Vui lòng chọn trạng thái phản ánh!",
                    },
                  ]
                : []
            }
          >
            <Select
              placeholder="Chọn trạng thái..."
              className="w-full"
              options={[
                { value: "IN_PROGRESS", label: "Đang xử lý" },
                { value: "COMPLETED", label: "Hoàn thành xử lý" },
                { value: "RESOLVED", label: "Đã giải quyết" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="expectedTime"
            label={
              <span className="text-xs font-bold text-slate-600">
                Thời gian dự kiến hoàn thành mới
              </span>
            }
          >
            <DatePicker
              placeholder="Chọn thời gian dự kiến mới..."
              className="w-full"
              disabledDate={disabledDate}
            />
          </Form.Item>

          <Form.Item
            name="reportContent"
            label={
              <span className="text-xs font-bold text-slate-600">
                Nội dung báo cáo <span className="text-red-500">*</span>
              </span>
            }
            rules={[
              { required: true, message: "Vui lòng nhập nội dung báo cáo!" },
            ]}
          >
            <TextArea
              placeholder="Mô tả chi tiết quá trình xử lý, kết quả..."
              rows={5}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
