import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Input,
  List,
  Modal,
  Form,
  Popconfirm,
  Spin,
  Tag,
  Tooltip,
  notification,
} from "antd";
import dayjs from "dayjs";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
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

export default function ResidentRejectedTab({ refetchMain }: Props) {
  const [selectedVerification, setSelectedVerification] =
    useState<Verification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Verification | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  const {
    data: verifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["resident-verifications-rejected", page, limit, search],
    queryFn: () =>
      getVerificationsApi({
        page,
        limit,
        verificationType: VerificationType.RESIDENT_REGISTRATION,
        status: VerificationStatus.REJECTED,
        keyword: search || undefined,
      } as any),
    refetchOnWindowFocus: true,
  });

  const handleManualApprove = async (values: { reason: string }) => {
    if (!approveTarget) return;
    try {
      setIsUpdating(true);
      await updateVerificationApi(approveTarget.id, {
        status: VerificationStatus.APPROVED,
        reviewNote: values.reason,
      });
      notification.success({
        message: "Đã duyệt thủ công",
        description: "Tài khoản đã được phê duyệt và thông báo đã được gửi.",
      });
      refetch();
      if (refetchMain) refetchMain();
      setIsApproveModalOpen(false);
      setApproveTarget(null);
      form.resetFields();
    } catch {
      notification.error({
        message: "Thất bại",
        description: "Duyệt thủ công thất bại",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const displayData =
    verifications?.data?.filter((item) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        item.title?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s) ||
        item.user?.fullName?.toLowerCase().includes(s)
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
              <div className="w-full bg-white p-4 rounded-lg border border-red-100 hover:border-red-300 hover:shadow-md transition-all group flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <XCircle size={24} className="text-red-400" />
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
                      <span>{item.user?.phoneNumber}</span>
                      <span>•</span>
                      <span>
                        {dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    {item.reviewNote && (
                      <div className="flex items-start gap-1 text-xs text-red-500">
                        <AlertCircle size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">Lý do: {item.reviewNote}</span>
                      </div>
                    )}
                    {(item as any).cccd && (
                      <div className="text-xs text-slate-400 mt-1">
                        CCCD: <span className="font-mono">{(item as any).cccd}</span>
                        {(item as any).isMatchedContact === false && (
                          <Tag color="red" className="ml-2 text-[10px]">Không khớp DS</Tag>
                        )}
                        {(item as any).isMatchedContact === true && (
                          <Tag color="green" className="ml-2 text-[10px]">Khớp DS</Tag>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3 flex items-center gap-1 justify-end">
                    <Tooltip title="Duyệt thủ công (cần lý do)">
                      <Button
                        size="small"
                        type="primary"
                        icon={<ShieldCheck size={14} />}
                        className="bg-amber-500 border-amber-500 hover:bg-amber-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setApproveTarget(item);
                          setIsApproveModalOpen(true);
                        }}
                      >
                        Duyệt thủ công
                      </Button>
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
              </div>
            </List.Item>
          )}
          locale={{ emptyText: "Không có đăng ký bị từ chối nào" }}
          pagination={{
            current: page,
            total: verifications?.meta?.total || 0,
            pageSize: limit,
            onChange: (p) => setPage(p),
            hideOnSinglePage: true,
          }}
        />
      )}

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết đăng ký bị từ chối"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="primary"
              className="bg-amber-500 border-amber-500 hover:bg-amber-400"
              icon={<ShieldCheck size={14} />}
              onClick={() => {
                setIsDetailModalOpen(false);
                setApproveTarget(selectedVerification);
                setIsApproveModalOpen(true);
              }}
            >
              Duyệt thủ công
            </Button>
          </div>
        }
        width={650}
      >
        {selectedVerification && (
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  {selectedVerification.title}
                </h3>
              </div>
              <Tag color="red" icon={<XCircle size={12} />} className="flex items-center gap-1">
                Đã từ chối
              </Tag>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Người đăng ký
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
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
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <span className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                  Lý do từ chối
                </span>
                <p className="text-sm text-red-600">
                  {selectedVerification.reviewNote || "Không có lý do cụ thể"}
                </p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nội dung đăng ký
              </span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                {selectedVerification.description}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal duyệt thủ công */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-500" />
            <span>Duyệt thủ công — cần nhập lý do</span>
          </div>
        }
        open={isApproveModalOpen}
        onCancel={() => {
          setIsApproveModalOpen(false);
          setApproveTarget(null);
          form.resetFields();
        }}
        footer={null}
        width={520}
      >
        <div className="py-2">
          {approveTarget && (
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700">
                Bạn đang duyệt thủ công cho:{" "}
                <strong>{approveTarget.user?.fullName}</strong> ({approveTarget.user?.phoneNumber})
              </p>
              <p className="text-xs text-amber-500 mt-1">
                Lưu ý: Tài khoản sẽ được kích hoạt ngay sau khi duyệt.
              </p>
            </div>
          )}
          <Form form={form} layout="vertical" onFinish={handleManualApprove}>
            <Form.Item
              name="reason"
              label={
                <span className="font-medium text-slate-700">
                  Lý do duyệt thủ công <span className="text-red-500">*</span>
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng nhập lý do duyệt thủ công" },
                { min: 10, message: "Lý do phải có ít nhất 10 ký tự" },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Ví dụ: Đã xác minh trực tiếp tại UBND, CCCD hợp lệ..."
                maxLength={500}
                showCount
              />
            </Form.Item>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsApproveModalOpen(false);
                  setApproveTarget(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                icon={<CheckCircle size={14} />}
                className="bg-amber-500 border-amber-500 hover:bg-amber-400"
              >
                Xác nhận duyệt
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
