import {
  Button,
  Card,
  Descriptions,
  Empty,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft } from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  WMSTileLayer,
} from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";

// Fix Leaflet icon issue
import { formatCurrencyNumber } from "@/components/utils/currency";
import { DamageCategory, DamageStatus } from "@/pages/floodDamages/enum";
import type { IFloodDamage } from "@/pages/floodDamages/interfaces";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { HouseTypeLabel } from "../constants";
import { useResidentById } from "../hooks";

const { Text } = Typography;

const categoryConfig: Record<DamageCategory, { label: string; color: string }> =
  {
    [DamageCategory.ECONOMIC]: { label: "Kinh tế", color: "green" },
    [DamageCategory.PROPERTY]: { label: "Tài sản", color: "blue" },
    [DamageCategory.BUSINESS]: { label: "Kinh doanh", color: "orange" },
    [DamageCategory.HEALTH]: { label: "Sức khỏe", color: "purple" },
    [DamageCategory.FATALITY]: { label: "Thương vong", color: "red" },
    [DamageCategory.OTHER]: { label: "Khác", color: "default" },
  };

const defaultIcon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function DetailResidents() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Load chi tiết hộ dân (đã kèm danh sách thiệt hại)
  const { data, isLoading } = useResidentById(Number(id));
  const resident = data?.data;
  const damages = resident?.floodDamages || [];

  const damageColumns: ColumnsType<IFloodDamage> = [
    {
      title: "Loại thiệt hại",
      dataIndex: "damageCategory",
      render: (cat: DamageCategory) => {
        const cfg = categoryConfig[cat];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "Giá trị ước tính",
      dataIndex: "estimatedValue",
      align: "right",
      render: (val: number) =>
        val ? formatCurrencyNumber(val) + " VND" : "---",
    },
    {
      title: "Thương vong",
      render: (_, record: IFloodDamage) =>
        record.injuredCount || record.deathCount ? (
          <div className="flex gap-1">
            {record.injuredCount > 0 && (
              <Tag color="orange">Bị thương: {record.injuredCount}</Tag>
            )}
            {record.deathCount > 0 && (
              <Tag color="red">Tử vong: {record.deathCount}</Tag>
            )}
          </div>
        ) : (
          "Không có"
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: DamageStatus) => (
        <Tag
          color={
            status === DamageStatus.APPROVED
              ? "green"
              : status === DamageStatus.PENDING
                ? "blue"
                : "red"
          }
        >
          {status === DamageStatus.APPROVED
            ? "Đã kiểm chứng"
            : status === DamageStatus.PENDING
              ? "Chờ kiểm chứng"
              : "Từ chối"}
        </Tag>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <p className="text-gray-500">Không tìm thấy thông tin hộ dân.</p>
      </div>
    );
  }

  const position: [number, number] = [
    resident.latitude || 10.8651,
    resident.longitude || 106.7306,
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-900"
        />
        <h1 className="text-xl font-bold m-0">Chi tiết hộ dân</h1>
      </div>

      {/* 2 Blocks: Small screens = 1 column (vertical), Large screens = 2 columns (horizontal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Block 1: Thông tin chi tiết */}
        <Card
          title="Thông tin nhân khẩu học"
          className="shadow-sm rounded-xl border border-gray-100"
        >
          <Descriptions
            column={1}
            labelStyle={{ minWidth: 150, color: "#646970" }}
          >
            <Descriptions.Item label="Mã hộ dân">
              <span className="font-semibold">
                {resident?.residentCode || "---"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Chủ hộ">
              <span className="font-semibold">
                {resident?.fullName || "---"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {resident?.phoneNumber || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {resident?.email || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {resident?.address || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Loại nhà ở">
              {HouseTypeLabel[resident?.houseType] || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Số tầng">
              {resident?.numberOfFloors || "0"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Block 2: Các thông tin bổ sung / Thống kê */}
        <Card
          title="Thông tin bổ sung"
          className="shadow-sm rounded-xl border border-gray-100"
        >
          <div className="flex flex-col gap-6">
            <Descriptions
              column={1}
              labelStyle={{ minWidth: 150, color: "#646970" }}
            >
              <Descriptions.Item label="Số thành viên">
                <span className="text-lg font-bold text-blue-600">
                  {resident?.numberOfMembers || 0}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Có kinh doanh">
                {resident?.hasBusiness === "YES" ? (
                  <Tag color="green">Có</Tag>
                ) : (
                  <Tag color="default">Không</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Có người già">
                {resident?.hasElderly === "YES" ? (
                  <Tag color="orange">Có</Tag>
                ) : (
                  <Tag color="default">Không</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Có trẻ em">
                {resident?.hasChildren === "YES" ? (
                  <Tag color="blue">Có</Tag>
                ) : (
                  <Tag color="default">Không</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Phụ nữ mang thai">
                {resident?.hasPregnantWomen === "YES" ? (
                  <Tag color="pink">Có</Tag>
                ) : (
                  <Tag color="default">Không</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Bệnh mạn tính/nền">
                {resident?.hasChronicDisease === "YES" ? (
                  <Tag color="red">Có</Tag>
                ) : (
                  <Tag color="default">Không</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </Card>
      </div>

      {/* Block 3: Bản đồ vị trí */}
      <Card
        title="Vị trí trên bản đồ"
        className="shadow-sm rounded-xl border border-gray-100 overflow-hidden"
      >
        <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200">
          <MapContainer
            center={position}
            zoom={16}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <WMSTileLayer
              url="http://localhost:8000/geoserver/tambinh/wms"
              layers="tambinh:tam-binh_map"
              format="image/png"
              transparent={true}
            />
            <Marker position={position}>
              <Popup>
                <div className="flex flex-col gap-1">
                  <p className="m-0 font-bold text-blue-600">
                    {resident.fullName}
                  </p>
                  <p className="m-0 text-gray-600 text-xs">
                    {resident.address}
                  </p>
                  <p className="m-0 text-gray-400 text-[10px]">
                    Toạ độ: {resident.latitude}, {resident.longitude}
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </Card>

      {/* Block 4: Thiệt hại liên quan */}
      <Card
        title="Thiệt hại liên quan"
        className="shadow-sm rounded-xl border border-gray-100"
      >
        {damages.length === 0 ? (
          <Empty
            description="Chưa có thông tin thiệt hại nào cho hộ dân này"
            className="py-8"
          />
        ) : (
          <Table
            dataSource={damages}
            columns={damageColumns}
            rowKey="id"
            pagination={false}
            size="middle"
            bordered
          />
        )}
      </Card>
    </div>
  );
}
