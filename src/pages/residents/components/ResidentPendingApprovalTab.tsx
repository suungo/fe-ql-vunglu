import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import {
  Button,
  Input,
  List,
  Modal,
  Popconfirm,
  Spin,
  Tag,
  Tooltip,
  notification,
} from "antd";
import dayjs from "dayjs";
import {
  Check,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
} from "lucide-react";
import {
  getVerificationsApi,
  updateVerificationApi,
} from "../../verification/api";
import {
  VerificationStatus,
  VerificationType,
  type Verification,
} from "../../verification/interfaces";

interface Props {
  refetchMain?: () => void;
}

export default function ResidentPendingApprovalTab({ refetchMain }: Props) {
  const [selectedVerification, setSelectedVerification] =
    useState<Verification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState("");

  const {
    data: verifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["resident-verifications", page, limit, search],
    queryFn: () =>
      getVerificationsApi({
        page,
        limit,
        verificationType: VerificationType.RESIDENT_REGISTRATION,
        status: VerificationStatus.PENDING,
        keyword: search || undefined,
      } as any),
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
      console.log("[ResidentVerification] Connected to notification socket");
    });

    socket.on("newNotification", (notification: any) => {
      const relatedTypes = ["VERIFICATION_UPDATE", "NEW_VERIFICATION"];
      if (
        relatedTypes.includes(notification?.type || "") ||
        notification?.title?.toLowerCase().includes("xác minh") ||
        notification?.title?.toLowerCase().includes("tài khoản")
      ) {
        refetch();
      }
    });

    socket.on("connect_error", (error: Error) => {
      console.error("[ResidentVerification] Socket error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);

  const handleVerify = async (id: number, status: VerificationStatus) => {
    try {
      setIsUpdating(true);
      await updateVerificationApi(id, { status });
      notification.success({
        title: "Thành công",
        description:
          status === VerificationStatus.APPROVED
            ? "Đã duyệt tài khoản thành công!"
            : "Đã từ chối tài khoản thành công!",
      });
      refetch();
      if (refetchMain) refetchMain();
      if (selectedVerification?.id === id) {
        setIsDetailModalOpen(false);
      }
    } catch {
      notification.error({
        title: "Thất bại",
        description: "Thao tác phê duyệt thất bại",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusTag = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.PENDING:
        return (
          <Tag
            color="orange"
            icon={<Clock size={12} />}
            className="flex items-center gap-1"
          >
            Chờ duyệt
          </Tag>
        );
      case VerificationStatus.APPROVED:
        return (
          <Tag
            color="green"
            icon={<CheckCircle size={12} />}
            className="flex items-center gap-1"
          >
            Đã duyệt
          </Tag>
        );
      case VerificationStatus.REJECTED:
        return (
          <Tag
            color="red"
            icon={<XCircle size={12} />}
            className="flex items-center gap-1"
          >
            Từ chối
          </Tag>
        );
      default:
        return <Tag>Mới</Tag>;
    }
  };

  const displayData =
    verifications?.data?.filter((item) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        item.title?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s) ||
        item.user?.fullName?.toLowerCase().includes(s) ||
        item.code?.toLowerCase().includes(s)
      );
    }) || [];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-end gap-2">
        <Input
          placeholder="Tìm kiếm"
          className="h-9! w-64!"
          prefix={<Search className="text-[#484848]" size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Tooltip title="Tải lại">
          <RefreshCw
            size={20}
            className={`cursor-pointer text-slate-400 hover:text-blue-500 transition ${isLoading ? "animate-spin" : ""}`}
            onClick={() => refetch()}
          />
        </Tooltip>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <List
          dataSource={displayData}
          split={false}
          className="space-y-3"
          renderItem={(item: Verification) => (
            <List.Item className="p-0! border-0! mb-3">
              <div
                className="w-full bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
                onClick={() => {
                  setSelectedVerification(item);
                  setIsDetailModalOpen(true);
                }}
              >
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText size={24} className="text-blue-500" />
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-6">
                    <div className="font-semibold text-slate-800 line-clamp-1">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <User size={12} />
                      <span>{item.user?.fullName || "Người dùng"}</span>
                      <span>•</span>
                      <span>
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex items-center gap-2 text-[14px]">
                    {getStatusTag(item.status)}
                    {(item as any).cccd && (
                      <>
                        {(item as any).isMatchedContact === true && (
                          <Tag
                            color="green"
                            className="flex items-center gap-1 text-xs"
                          >
                            Khớp CCCD
                          </Tag>
                        )}
                        {(item as any).isMatchedContact === false && (
                          <Tag
                            color="orange"
                            className="flex items-center gap-1 text-xs"
                          >
                            Không khớp
                          </Tag>
                        )}
                        {(item as any).isMatchedContact == null && (
                          <Tag
                            color="default"
                            className="flex items-center gap-1 text-xs"
                          >
                            Chưa đối chiếu
                          </Tag>
                        )}
                      </>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <span className="text-sm text-slate-500 line-clamp-1 italic">
                      Mã: {item.code}
                    </span>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 shrink-0 pl-2 border-l border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Duyệt">
                    <Popconfirm
                      title="Duyệt yêu cầu này?"
                      onConfirm={() =>
                        handleVerify(item.id, VerificationStatus.APPROVED)
                      }
                    >
                      <Button
                        type="text"
                        shape="circle"
                        icon={<Check size={18} className="text-green-500" />}
                      />
                    </Popconfirm>
                  </Tooltip>
                  <Tooltip title="Từ chối">
                    <Popconfirm
                      title="Từ chối yêu cầu này?"
                      onConfirm={() =>
                        handleVerify(item.id, VerificationStatus.REJECTED)
                      }
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        shape="circle"
                        danger
                        icon={<X size={18} />}
                      />
                    </Popconfirm>
                  </Tooltip>
                  <Tooltip title="Xem chi tiết">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<Eye size={18} className="text-slate-400" />}
                      onClick={() => {
                        setSelectedVerification(item);
                        setIsDetailModalOpen(true);
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: "Không có yêu cầu phê duyệt tài khoản nào" }}
          pagination={{
            current: page,
            total: verifications?.meta?.total || 0,
            pageSize: limit,
            onChange: (p) => setPage(p),
            hideOnSinglePage: true,
          }}
        />
      )}

      <Modal
        title="Chi tiết yêu cầu phê duyệt tài khoản"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              danger
              onClick={() =>
                handleVerify(
                  selectedVerification!.id,
                  VerificationStatus.REJECTED,
                )
              }
              loading={isUpdating}
            >
              Từ chối
            </Button>
            <Button
              type="primary"
              onClick={() =>
                handleVerify(
                  selectedVerification!.id,
                  VerificationStatus.APPROVED,
                )
              }
              loading={isUpdating}
            >
              Phê duyệt tài khoản
            </Button>
          </div>
        }
        width={650}
      >
        {selectedVerification && (
          <div className="space-y-5 py-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  {selectedVerification.title}
                </h3>
                <div className="text-sm text-slate-500">
                  Mã yêu cầu:{" "}
                  <span className="font-mono text-blue-600 font-bold">
                    {selectedVerification.code}
                  </span>
                </div>
              </div>
              {getStatusTag(selectedVerification.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Hộ dân đăng ký
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700">
                      {selectedVerification.user?.fullName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedVerification.user?.phoneNumber}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Thông tin chung
                </span>
                <div className="space-y-1">
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-500">Ngày tạo:</span>{" "}
                    <span>
                      {new Date(
                        selectedVerification.createdAt,
                      ).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="text-sm flex justify-between">
                    <span className="text-slate-500">Thời gian:</span>{" "}
                    <span>
                      {dayjs(selectedVerification.createdAt).format("HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nội dung đăng ký
              </span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedVerification.description}
              </div>
            </div>

            {selectedVerification.attachments &&
              selectedVerification.attachments.length > 0 && (
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Tài liệu/Hình ảnh đính kèm
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedVerification.attachments.map(
                      (img: string, index: number) => (
                        <img
                          key={index}
                          src={img}
                          alt="attachment"
                          className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-sm"
                        />
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
