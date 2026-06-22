import { Role } from "@/enums";
import {
  Button,
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
  Trash2,
  User,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateVerificationApi } from "../api";
import {
  VerificationStatus,
  VerificationType,
  type Verification,
} from "../interfaces";
import { useVerificationData } from "../hooks/useVerificationData";

export default function ListVerification() {
  const navigate = useNavigate();
  const {
    selectedVerification,
    setSelectedVerification,
    isDetailModalOpen,
    setIsDetailModalOpen,
    page,
    setPage,
    limit,
    isUpdating,
    setIsUpdating,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    verifications,
    isLoading,
    refetch,
    profileData,
    handleVerify,
    handleDelete,
  } = useVerificationData();

  useEffect(() => {
    if (
      profileData &&
      (profileData.role.roleCode === Role.ADMIN ||
        profileData.role.roleCode === Role.MANAGER)
    ) {
      navigate("/app/dashboard");
    }
  }, [profileData, navigate]);

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
      case VerificationStatus.COMPLETED:
        return (
          <Tag
            color="blue"
            icon={<CheckCircle size={12} />}
            className="flex items-center gap-1"
          >
            Hoàn thành
          </Tag>
        );
      default:
        return <Tag>Mới</Tag>;
    }
  };

  const getTypeLabel = (type: VerificationType) => {
    switch (type) {
      case VerificationType.REFLECTION:
        return "Phản ánh sự cố";
      case VerificationType.RESIDENT_REGISTRATION:
        return "Đăng ký cư trú";
      case VerificationType.VEHICLE_REGISTRATION:
        return "Đăng ký phương tiện";
      default:
        return "Khác";
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 p-4 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-800">
            Danh sách yêu cầu xác thực
          </div>
          <RefreshCw
            size={20}
            className={`cursor-pointer text-slate-400 hover:text-blue-500 transition ${isLoading ? "animate-spin" : ""}`}
            onClick={() => refetch()}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <List
            dataSource={verifications?.data}
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
                    <div className="md:col-span-5">
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

                    <div className="md:col-span-4 flex items-center gap-2 text-[14px]">
                      {getStatusTag(item.status)}
                      <Tag>{getTypeLabel(item.verificationType)}</Tag>
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
                    {item.status === VerificationStatus.PENDING && (
                      <>
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
                              icon={
                                <Check size={18} className="text-green-500" />
                              }
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
                      </>
                    )}
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
                    {profileData?.role?.roleCode === Role.ADMIN && (
                      <Tooltip title="Xóa">
                        <Button
                          type="text"
                          shape="circle"
                          icon={<Trash2 size={18} className="text-red-500!" />}
                          onClick={() => {
                            setSelectedVerification(item);
                            setIsDeleteModalOpen(true);
                          }}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
            locale={{ emptyText: "Không có yêu cầu nào cần xử lý" }}
            pagination={{
              current: page,
              pageSize: limit,
              total: verifications?.meta?.total || 0,
              onChange: (p) => setPage(p),
              hideOnSinglePage: true,
            }}
          />
        )}
      </div>

      <Modal
        title="Chi tiết yêu cầu xác thực"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={
          selectedVerification?.status === VerificationStatus.PENDING ? (
            <div className="flex justify-end gap-2">
              <Button
                danger
                onClick={() =>
                  handleVerify(
                    selectedVerification.id,
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
                    selectedVerification.id,
                    VerificationStatus.APPROVED,
                  )
                }
                loading={isUpdating}
              >
                Duyệt xác thực
              </Button>
            </div>
          ) : selectedVerification?.status === VerificationStatus.APPROVED &&
            selectedVerification.verificationType ===
              VerificationType.REFLECTION ? (
            <div className="flex justify-end gap-2">
              {(profileData?.role?.roleCode === Role.ADMIN ||
                profileData?.role?.roleCode === Role.MANAGER) && (
                <>
                  <Button
                    danger
                    onClick={() =>
                      handleVerify(
                        selectedVerification.id,
                        VerificationStatus.REJECTED,
                      )
                    }
                    loading={isUpdating}
                  >
                    Từ chối
                  </Button>
                  <Button
                    type="primary"
                    icon={<UserCheck size={15} />}
                    style={{
                      backgroundColor: "#7c3aed",
                      borderColor: "#7c3aed",
                    }}
                    onClick={async () => {
                      if (!selectedVerification.referenceId) {
                        notification.warning({
                          title: "Không có phản ánh liên kết",
                          description:
                            "Yêu cầu này không liên kết với phản ánh nào.",
                        });
                        return;
                      }
                      try {
                        setIsUpdating(true);
                        await updateVerificationApi(selectedVerification.id, {
                          status: VerificationStatus.COMPLETED,
                        });
                        setIsDetailModalOpen(false);
                        navigate("/app/dispatch-manager/list");
                      } catch {
                        notification.error({
                          title: "Lỗi",
                          description: "Không thể cập nhật trạng thái yêu cầu xác thực.",
                        });
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    loading={isUpdating}
                  >
                    Phân công cho Tuần tra
                  </Button>
                </>
              )}
              <Button onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>
            </div>
          )
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
                  Người gửi
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
                    <span className="text-slate-500">Loại:</span>{" "}
                    <span className="font-semibold">
                      {getTypeLabel(selectedVerification.verificationType)}
                    </span>
                  </div>
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
                Nội dung chi tiết
              </span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedVerification.description}
              </div>
            </div>

            {selectedVerification.attachments &&
              selectedVerification.attachments.length > 0 && (
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Hình ảnh đính kèm
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

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedVerification(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedVerification(null);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="delete"
            danger
            loading={isDeleting}
            onClick={handleDelete}
          >
            Xóa
          </Button>,
        ]}
      >
        {selectedVerification && (
          <div className="py-4">
            <p className="text-[16px]">
              Bạn có chắc chắn muốn xóa yêu cầu xác thực{" "}
              <strong>"{selectedVerification.title}"</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Mã yêu cầu: {selectedVerification.code}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
