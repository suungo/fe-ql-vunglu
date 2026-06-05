import { Role } from "@/enums";
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
} from "lucide-react";
import { useState, useMemo } from "react";
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
} from "../hooks";
import { DispatchItemCard } from "../components/DispatchItemCard";

const { TextArea } = Input;

export default function ListDispatch() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] =
    useState<DispatchReport | null>(null);

  // Form tạo điều chuyển
  const [createType, setCreateType] = useState<"inspector" | "patrol">(
    "inspector",
  );
  const [reflectionId, setReflectionId] = useState<number | null>(null);
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createNote, setCreateNote] = useState("");

  // Form cập nhật báo cáo
  const [reportContent, setReportContent] = useState("");
  const [reflectionStatusUpdate, setReflectionStatusUpdate] = useState("");

  const statusFilter = useMemo(() => {
    if (activeTab === "ALL") return undefined;
    return activeTab as DispatchReportStatus;
  }, [activeTab]);

  // 1. Tải danh sách điều chuyển (Sử dụng Hook mới)
  const {
    data: dispatches,
    isLoading,
    refetch,
  } = useDispatchReports({ page, limit, status: statusFilter });

  // Tải profile của user
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  // 2. Tải danh sách phản ánh & cán bộ cho form tạo (Chỉ khi modal mở - Tối ưu hóa API load)
  const staffRole = createType === "inspector" ? "INSPECTOR" : "PATROL";
  const { data: reflectionsData } = useVerifiedReflections(isCreateModalOpen);
  const { data: staffListData } = useStaffList(staffRole, isCreateModalOpen);

  const reflectionList = reflectionsData?.data || [];
  const staffList = staffListData?.data || [];

  // 3. Đăng ký Socket real-time (Sử dụng Hook mới)
  useDispatchSocket(refetch);

  // 4. Mutations cho các tác vụ thay đổi dữ liệu (Sử dụng Hook mới)
  const createInspectorMutation = useCreateDispatchToInspector();
  const createPatrolMutation = useCreateDispatchToPatrol();
  const acceptMutation = useAcceptDispatch();
  const updateReportMutation = useUpdateDispatchReport();

  // ── HELPERS ──────────────────────────────────────────────────────────

  const getStatusTag = (status: DispatchReportStatus) => {
    const map: Record<
      DispatchReportStatus,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      [DispatchReportStatus.PENDING]: {
        color: "orange",
        icon: <Clock size={12} />,
        label: "Chờ xác nhận",
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
    if (type === DispatchReportType.MANAGER_TO_INSPECTOR)
      return <Tag color="purple">QL → Hậu kiểm</Tag>;
    return <Tag color="blue">Hậu kiểm → Tuần tra</Tag>;
  };

  const Clock = ({ size }: { size: number }) => (
    <span className="inline-flex items-center justify-center">
      <CheckCircle size={size} />
    </span>
  );
  const Timer = ({ size }: { size: number }) => (
    <span className="inline-flex items-center justify-center">
      <CheckCircle size={size} />
    </span>
  );

  // ── XỬ LÝ TẠO ĐIỀU CHUYỂN ──────────────────────────────────────────

  const handleCreate = async () => {
    if (!reflectionId || !assignedTo) {
      notification.warning({ message: "Vui lòng chọn phản ánh và cán bộ" });
      return;
    }

    const data = {
      reflectionId,
      assignedTo,
      title: createTitle || undefined,
      description: createDesc || undefined,
      note: createNote || undefined,
    };

    const mutation =
      createType === "inspector"
        ? createInspectorMutation
        : createPatrolMutation;

    mutation.mutate(data, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Tạo điều chuyển thành công!",
        });
        setIsCreateModalOpen(false);
        resetCreateForm();
      },
      onError: (err: any) => {
        notification.error({
          message: "Thất bại",
          description:
            err?.response?.data?.message || "Không thể tạo điều chuyển",
        });
      },
    });
  };

  const resetCreateForm = () => {
    setReflectionId(null);
    setAssignedTo(null);
    setCreateTitle("");
    setCreateDesc("");
    setCreateNote("");
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

  const handleUpdateReport = async () => {
    if (!selectedDispatch) return;
    updateReportMutation.mutate(
      {
        id: selectedDispatch.id,
        data: {
          reportContent: reportContent || undefined,
          reflectionStatusUpdate: reflectionStatusUpdate || undefined,
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
          setReportContent("");
          setReflectionStatusUpdate("");
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

  // ── RENDER ──────────────────────────────────────────────────────────

  const roleCode = profileData?.role?.roleCode;
  const canCreate =
    roleCode === Role.ADMIN ||
    roleCode === Role.MANAGER ||
    roleCode === Role.INSPECTOR;

  const isMutationLoading =
    createInspectorMutation.isPending ||
    createPatrolMutation.isPending ||
    acceptMutation.isPending ||
    updateReportMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 p-4 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <ArrowRightLeft size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Quản lý điều chuyển
              </h2>
              <p className="text-xs text-slate-500">
                Theo dõi quá trình điều chuyển phản ánh giữa các cán bộ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button
                type="primary"
                icon={<Send size={14} />}
                className="flex items-center gap-1"
                style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
                onClick={() => {
                  setCreateType(
                    roleCode === Role.INSPECTOR ? "patrol" : "inspector",
                  );
                  setIsCreateModalOpen(true);
                }}
              >
                Tạo điều chuyển
              </Button>
            )}
            <Tooltip title="Làm mới">
              <RefreshCw
                size={20}
                className={`cursor-pointer text-slate-400 hover:text-blue-500 transition ${isLoading ? "animate-spin" : ""}`}
                onClick={() => refetch()}
              />
            </Tooltip>
          </div>
        </div>

        {/* Tabs lọc trạng thái */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPage(1);
          }}
          items={[
            { key: "ALL", label: "Tất cả" },
            { key: DispatchReportStatus.PENDING, label: "Chờ xác nhận" },
            { key: DispatchReportStatus.ACCEPTED, label: "Đã xác nhận" },
            { key: DispatchReportStatus.IN_PROGRESS, label: "Đang xử lý" },
            { key: DispatchReportStatus.COMPLETED, label: "Hoàn thành" },
            { key: DispatchReportStatus.EXPIRED, label: "Hết hạn" },
          ]}
          className="mb-2"
        />

        {/* Danh sách */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <List
            dataSource={dispatches?.data}
            split={false}
            className="space-y-3"
            renderItem={(item: DispatchReport) => (
              <List.Item className="p-0! border-0! mb-3">
                <DispatchItemCard
                  item={item}
                  onClick={() => {
                    setSelectedDispatch(item);
                    setIsDetailModalOpen(true);
                  }}
                  onViewDetail={() => {
                    setSelectedDispatch(item);
                    setIsDetailModalOpen(true);
                  }}
                />
              </List.Item>
            )}
            locale={{ emptyText: "Không có điều chuyển nào" }}
            pagination={{
              current: page,
              pageSize: limit,
              total: dispatches?.meta?.total || 0,
              onChange: (p) => setPage(p),
              hideOnSinglePage: true,
            }}
          />
        )}
      </div>

      {/* ══════════ MODAL CHI TIẾT ══════════ */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-purple-600" />
            <span>Chi tiết biên bản điều chuyển</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={700}
        footer={
          selectedDispatch ? (
            <div className="flex justify-end gap-2">
              {/* Nút xác nhận nhận việc (INSPECTOR/PATROL khi PENDING) */}
              {selectedDispatch.status === DispatchReportStatus.PENDING &&
                selectedDispatch.assignedTo === profileData?.id && (
                  <Button
                    type="primary"
                    icon={<CheckCircle size={14} />}
                    onClick={() => handleAccept(selectedDispatch.id)}
                    loading={isMutationLoading}
                    style={{ backgroundColor: "#059669" }}
                  >
                    Xác nhận nhận việc
                  </Button>
                )}
              {/* Nút cập nhật báo cáo (khi ACCEPTED) */}
              {selectedDispatch.status === DispatchReportStatus.ACCEPTED &&
                selectedDispatch.assignedTo === profileData?.id && (
                  <Button
                    type="primary"
                    icon={<FileText size={14} />}
                    onClick={() => {
                      setReportContent(selectedDispatch.reportContent || "");
                      setReflectionStatusUpdate(
                        selectedDispatch.reflectionStatusUpdate || "",
                      );
                      setIsReportModalOpen(true);
                    }}
                    style={{ backgroundColor: "#7c3aed" }}
                  >
                    Cập nhật báo cáo
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
                  {selectedDispatch.title || "Biên bản điều chuyển"}
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

            {/* Timeline */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                Tiến trình
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>
                    Tạo:{" "}
                    {dayjs(selectedDispatch.assignedAt).format("HH:mm DD/MM")}
                  </span>
                </div>
                <span className="text-slate-300">→</span>
                {selectedDispatch.acceptedAt ? (
                  <div className="flex items-center gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-cyan-500" />
                     <span>
                       Nhận:{" "}
                       {dayjs(selectedDispatch.acceptedAt).format(
                         "HH:mm DD/MM",
                       )}
                     </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-orange-600">
                      Hạn:{" "}
                      {dayjs(selectedDispatch.expiredAt).format("HH:mm DD/MM")}
                    </span>
                  </div>
                )}
                {selectedDispatch.completedAt && (
                  <>
                    <span className="text-slate-300">→</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-green-600" />
                      <span>
                        Xong:{" "}
                        {dayjs(selectedDispatch.completedAt).format(
                          "HH:mm DD/MM",
                        )}
                      </span>
                    </div>
                  </>
                )}
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
                      {selectedDispatch.assignee?.fullName || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedDispatch.assignee?.phoneNumber || ""}
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
                      📍 {selectedDispatch.reflection.address}
                    </div>
                  )}
                </div>
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
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Send size={18} className="text-purple-600" />
            <span>
              Tạo điều chuyển mới{" "}
              {createType === "inspector" ? "(→ Hậu kiểm)" : "(→ Tuần tra)"}
            </span>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          resetCreateForm();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsCreateModalOpen(false);
              resetCreateForm();
            }}
          >
            Hủy
          </Button>,
          <Button
            key="create"
            type="primary"
            loading={isMutationLoading}
            disabled={!reflectionId || !assignedTo}
            onClick={handleCreate}
            style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
            icon={<Send size={14} />}
          >
            Xác nhận điều chuyển
          </Button>,
        ]}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Phản ánh <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Chọn phản ánh..."
              className="w-full"
              value={reflectionId}
              onChange={(val) => setReflectionId(val)}
              options={reflectionList.map((r: any) => ({
                value: r.id,
                label: `#${r.id} — ${r.title || r.content?.slice(0, 50)}`,
              }))}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              notFoundContent={
                <div className="text-center text-slate-400 py-3 text-sm">
                  Không có phản ánh nào phù hợp
                </div>
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Cán bộ {createType === "inspector" ? "Hậu kiểm" : "Tuần tra"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Chọn cán bộ..."
              className="w-full"
              value={assignedTo}
              onChange={(val) => setAssignedTo(val)}
              options={staffList.map((u: any) => ({
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
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Tiêu đề (Tùy chọn)
            </label>
            <Input
              placeholder="Nhập tiêu đề biên bản..."
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Mô tả chi tiết (Tùy chọn)
            </label>
            <TextArea
              placeholder="Nhập mô tả chi tiết..."
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Ghi chú (Tùy chọn)
            </label>
            <TextArea
              placeholder="Nhập ghi chú..."
              value={createNote}
              onChange={(e) => setCreateNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
            <AlertTriangle size={14} className="inline mr-1.5" />
            Cán bộ được chỉ định sẽ có <strong>5 phút</strong> để xác nhận. Nếu
            quá hạn, điều chuyển sẽ tự động hủy và bạn có thể tạo lại.
          </div>
        </div>
      </Modal>

      {/* ══════════ MODAL CẬP NHẬT BÁO CÁO ══════════ */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-green-600" />
            <span>Cập nhật biên bản báo cáo</span>
          </div>
        }
        open={isReportModalOpen}
        onCancel={() => setIsReportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsReportModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isMutationLoading}
            disabled={!reportContent}
            onClick={handleUpdateReport}
            style={{ backgroundColor: "#059669" }}
            icon={<Check size={14} />}
          >
            Hoàn thành báo cáo
          </Button>,
        ]}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Trạng thái phản ánh{" "}
              {selectedDispatch?.type ===
                DispatchReportType.INSPECTOR_TO_PATROL && (
                <span className="text-red-500">* (Bắt buộc)</span>
              )}
            </label>
            <Select
              placeholder="Chọn trạng thái..."
              className="w-full"
              value={reflectionStatusUpdate || undefined}
              onChange={(val) => setReflectionStatusUpdate(val)}
              options={[
                { value: "IN_PROGRESS", label: "Đang xử lý" },
                { value: "COMPLETED", label: "Hoàn thành xử lý" },
                { value: "RESOLVED", label: "Đã giải quyết" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Nội dung báo cáo <span className="text-red-500">*</span>
            </label>
            <TextArea
              placeholder="Mô tả chi tiết quá trình xử lý, kết quả..."
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              rows={5}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
