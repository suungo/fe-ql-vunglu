import {
  Button,
  Card,
  Descriptions,
  Modal,
  Space,
  Tag,
  Typography,
  notification,
  Spin,
} from "antd";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  HeartPulse,
  Leaf,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DamageCategory, DamageStatus } from "../enum";
import {
  useFloodDamageDetail,
  useDeleteFloodDamage,
  useUpdateFloodDamageStatus,
} from "../hooks";
import { Role } from "@/enums";

const { Title, Text } = Typography;

const categoryConfig: Record<
  DamageCategory,
  { label: string; color: string; icon: React.ReactNode; desc: string }
> = {
  [DamageCategory.ECONOMIC]: {
    label: "Kinh tế",
    color: "green",
    icon: <Leaf size={18} />,
    desc: "Thiệt hại về cây trồng, vật nuôi, sản xuất",
  },
  [DamageCategory.PROPERTY]: {
    label: "Tài sản",
    color: "blue",
    icon: <Building2 size={18} />,
    desc: "Thiệt hại về nhà cửa, đồ đạc, cơ sở vật chất",
  },
  [DamageCategory.BUSINESS]: {
    label: "Kinh doanh",
    color: "orange",
    icon: <TrendingUp size={18} />,
    desc: "Ảnh hưởng đến hoạt động kinh doanh, thương mại",
  },
  [DamageCategory.HEALTH]: {
    label: "Sức khỏe",
    color: "purple",
    icon: <HeartPulse size={18} />,
    desc: "Ảnh hưởng đến sức khỏe người dân",
  },
  [DamageCategory.FATALITY]: {
    label: "Thương vong",
    color: "red",
    icon: <AlertTriangle size={18} />,
    desc: "Có người bị thương hoặc tử vong",
  },
  [DamageCategory.OTHER]: {
    label: "Khác",
    color: "default",
    icon: null,
    desc: "Các thiệt hại khác",
  },
};

const statusConfig: Record<DamageStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [DamageStatus.PENDING]: { label: "Chờ kiểm chứng", color: "blue", icon: <Clock size={14} /> },
  [DamageStatus.APPROVED]: { label: "Đã kiểm chứng", color: "green", icon: <CheckCircle2 size={14} /> },
  [DamageStatus.REJECTED]: { label: "Từ chối", color: "red", icon: <XCircle size={14} /> },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function DetailFloodDamages() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = [Role.ADMIN, Role.MANAGER, Role.OFFICER].includes(user?.role?.roleCode);

  const { data: res, isLoading } = useFloodDamageDetail(id ? Number(id) : undefined);
  const deleteMutation = useDeleteFloodDamage();
  const statusMutation = useUpdateFloodDamageStatus();

  const damage = res?.data;

  const handleDelete = () => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa bản ghi thiệt hại này không?",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(Number(id));
          notification.success({ message: "Đã xóa thiệt hại thành công" });
          navigate("/app/flood-damages-manager/list");
        } catch {
          notification.error({ message: "Xóa thất bại, vui lòng thử lại" });
        }
      },
    });
  };

  const handleUpdateStatus = (status: "APPROVED" | "REJECTED") => {
    const isApprove = status === "APPROVED";
    Modal.confirm({
      title: isApprove ? "Xác nhận duyệt thiệt hại" : "Xác nhận từ chối thiệt hại",
      content: isApprove
        ? "Thiệt hại sẽ được đánh dấu đã kiểm chứng và người dân sẽ nhận thông báo."
        : "Thiệt hại sẽ bị từ chối và người dân sẽ nhận thông báo.",
      okText: isApprove ? "Duyệt" : "Từ chối",
      okButtonProps: { danger: !isApprove },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await statusMutation.mutateAsync({ id: Number(id), status });
          notification.success({
            message: isApprove ? "Đã duyệt thiệt hại" : "Đã từ chối thiệt hại",
          });
        } catch {
          notification.error({ message: "Cập nhật trạng thái thất bại" });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!damage) {
    return (
      <div className="p-6 text-center text-slate-500">
        Không tìm thấy thông tin thiệt hại.
        <br />
        <Button className="mt-4" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  const config = categoryConfig[damage.damageCategory as DamageCategory] ?? categoryConfig[DamageCategory.OTHER];
  const statusCfg = statusConfig[damage.status as DamageStatus] ?? statusConfig[DamageStatus.PENDING];

  return (
    <div className="p-4 space-y-4 bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Space>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1"
          >
            Quay lại
          </Button>
          <Title level={4} className="mb-0!">
            Chi tiết thiệt hại #{id}
          </Title>
        </Space>
        <Space>
          {isManager && damage.status === DamageStatus.PENDING && (
            <>
              <Button
                type="primary"
                icon={<CheckCircle2 size={15} />}
                onClick={() => handleUpdateStatus("APPROVED")}
                loading={statusMutation.isPending}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<XCircle size={15} />}
                onClick={() => handleUpdateStatus("REJECTED")}
                loading={statusMutation.isPending}
                className="flex items-center gap-1"
              >
                Từ chối
              </Button>
            </>
          )}
          <Button
            icon={<Trash2 size={15} />}
            danger
            onClick={handleDelete}
            loading={deleteMutation.isPending}
            className="flex items-center gap-1"
          >
            Xóa
          </Button>
        </Space>
      </div>

      {/* Status Banner */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
        damage.status === DamageStatus.APPROVED ? "bg-emerald-50 border border-emerald-200" :
        damage.status === DamageStatus.REJECTED ? "bg-red-50 border border-red-200" :
        "bg-blue-50 border border-blue-200"
      }`}>
        {statusCfg.icon}
        <Tag color={statusCfg.color} className="text-sm font-medium m-0">
          {statusCfg.label}
        </Tag>
        {damage.reviewedBy && (
          <Text type="secondary" className="text-xs">
            Xét duyệt bởi: {(damage as any).reviewer?.fullName || `User #${damage.reviewedBy}`}
            {damage.reviewedAt ? ` lúc ${new Date(damage.reviewedAt).toLocaleString("vi-VN")}` : ""}
          </Text>
        )}
      </div>

      {/* Category Card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-${config.color}-100`}>
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag color={config.color} className="text-base px-3 py-1">
                {config.label}
              </Tag>
              <Text type="secondary">Loại thiệt hại</Text>
            </div>
            <Text>{config.desc}</Text>
          </div>
        </div>
      </Card>

      {/* Main Info */}
      <Card title={<Title level={5}>Thông tin chi tiết</Title>}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã thiệt hại" span={1}>
            #{damage.id}
          </Descriptions.Item>
          <Descriptions.Item label="Phản ánh liên kết" span={1}>
            <Button
              type="link"
              onClick={() => navigate(`/reflections/${damage.reflectionId}`)}
              className="p-0"
            >
              #{damage.reflectionId}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="Người ghi nhận" span={1}>
            {(damage as any).creator?.fullName || `User #${damage.createdBy}`}
          </Descriptions.Item>
          <Descriptions.Item label="Hộ dân liên kết" span={1}>
            {damage.householdId ? `#${damage.householdId}` : "Không liên kết"}
          </Descriptions.Item>
          <Descriptions.Item label="Giá trị ước tính" span={1}>
            <Text strong className="text-lg text-blue-600">
              {formatCurrency(damage.estimatedValue)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian ghi nhận" span={1}>
            {new Date(damage.createdAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối" span={2}>
            {new Date(damage.updatedAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
        </Descriptions>

        <div className="mt-4">
          <Text strong>Mô tả chi tiết:</Text>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
            <Text>{damage.description || "Chưa có mô tả"}</Text>
          </div>
        </div>
      </Card>

      {/* Casualties Card */}
      {(damage.injuredCount > 0 || damage.deathCount > 0) && (
        <Card
          title={<Title level={5}>Thông tin thương vong</Title>}
          className="border-red-200"
        >
          <div className="grid grid-cols-2 gap-4">
            {damage.injuredCount > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <Text type="secondary">Số người bị thương</Text>
                <div className="text-3xl font-bold text-orange-600">
                  {damage.injuredCount}
                </div>
              </div>
            )}
            {damage.deathCount > 0 && (
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <Text type="secondary">Số người tử vong</Text>
                <div className="text-3xl font-bold text-red-600">
                  {damage.deathCount}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
