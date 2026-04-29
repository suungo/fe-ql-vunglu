import {
    Button,
    Card,
    Descriptions,
    Space,
    Tag,
    Typography,
    message,
} from "antd";
import {
    AlertTriangle,
    Building2,
    Edit,
    HeartPulse,
    Leaf,
    Trash2,
    TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DamageCategory, DamageStatus } from "../enum";
import type { IFloodDamage } from "../interfaces";

const { Title, Text } = Typography;

// Mock data
const mockDamage: IFloodDamage = {
  id: 1,
  reflectionId: 1,
  householdId: 101,
  damageCategory: DamageCategory.PROPERTY,
  description:
    "Nhà bị ngập nước, tường loang lổ, nội thất hư hỏng nặng. Cần sửa chữa gấp để đảm bảo an toàn.",
  estimatedValue: 50000000,
  injuredCount: 0,
  deathCount: 0,
  createdAt: "2024-04-20T14:00:00Z",
  updatedAt: "2024-04-20T16:30:00Z",
  createdBy: 5,
  status: DamageStatus.PENDING,
};

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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export default function DetailFloodDamages() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [damage, setDamage] = useState<IFloodDamage | null>(null);

  useEffect(() => {
    // TODO: Load damage from API
    setDamage(mockDamage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    // TODO: Call API delete
    message.success("Đã xóa thiệt hại");
    navigate("/flood-damages");
  };

  const handleEdit = () => {
    navigate(`/flood-damages/edit/${id}`);
  };

  if (!damage) return null;

  const config = categoryConfig[damage.damageCategory];

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Space>
          <Title level={4} className="mb-0!">
            Chi tiết thiệt hại #{id}
          </Title>
        </Space>
        <Space>
          <Button icon={<Edit size={16} />} onClick={handleEdit}>
            Sửa
          </Button>
          <Button
            danger
            icon={<Trash2 size={16} />}
            onClick={handleDelete}
          >
            Xóa
          </Button>
        </Space>
      </div>

      {/* Category Card */}
      <Card className={`bg-${config.color}-50`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-${config.color}-100 rounded-xl`}>
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
            >
              #{damage.reflectionId}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="Mã hộ dân" span={1}>
            {damage.householdId || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Người ghi nhận" span={1}>
            User #{damage.createdBy}
          </Descriptions.Item>
          <Descriptions.Item label="Giá trị ước tính" span={1}>
            <Text strong className="text-lg text-blue-600">
              {formatCurrency(damage.estimatedValue)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian ghi nhận" span={1}>
            {new Date(damage.createdAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối" span={1}>
            {new Date(damage.updatedAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
        </Descriptions>

        <div className="mt-4">
          <Text strong>Mô tả chi tiết:</Text>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <Text>{damage.description}</Text>
          </div>
        </div>
      </Card>

      {/* Casualties Card - chỉ hiển thị nếu có */}
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
