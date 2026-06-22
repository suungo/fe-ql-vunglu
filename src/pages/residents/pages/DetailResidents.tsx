import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Select,
  Spin,
  Statistic,
  Table,
  Tag,
  Timeline,
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
import { Role } from "@/enums";
import { DamageCategory, DamageStatus } from "@/pages/floodDamages/enum";
import type { IFloodDamage } from "@/pages/floodDamages/interfaces";
import dayjs from "dayjs";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { HouseTypeLabel } from "../constants";
import type { HouseType } from "../enum";
import { useResidentById } from "../hooks";

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



  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdminOrManager =
    user?.role?.roleCode === Role.ADMIN ||
    user?.role?.roleCode === Role.MANAGER;

  const stats = useMemo(() => {
    const dList = damages || [];
    const totalEstimatedValue = dList.reduce(
      (sum, d) => sum + Number(d.estimatedValue || 0),
      0,
    );
    const totalInjured = dList.reduce(
      (sum, d) => sum + Number(d.injuredCount || 0),
      0,
    );
    const totalDeaths = dList.reduce(
      (sum, d) => sum + Number(d.deathCount || 0),
      0,
    );
    const uniqueReflections = resident?.reflections?.length || 0;

    const reflections = resident?.reflections || [];
    const resolvedReflections = reflections.filter(
      (r) => r.status === "RESOLVED" || r.status === "COMPLETED"
    ).length;
    const rejectedReflections = reflections.filter(
      (r) => r.status === "REJECTED"
    ).length;

    return {
      totalEstimatedValue,
      totalInjured,
      totalDeaths,
      uniqueReflections,
      resolvedReflections,
      rejectedReflections,
      totalDamages: dList.length,
    };
  }, [damages, resident?.reflections]);

  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("year");

  const chartData = useMemo(() => {
    if (!damages) return [];

    const now = dayjs();
    let aggregated: Record<string, number> = {};

    if (timeRange === "week") {
      // 7 ngày gần nhất
      for (let i = 6; i >= 0; i--) {
        const dateStr = now.subtract(i, "day").format("DD/MM");
        aggregated[dateStr] = 0;
      }
      damages.forEach((d) => {
        const dDate = dayjs(d.createdAt);
        if (now.diff(dDate, "day") <= 6 && now.diff(dDate, "day") >= 0) {
          const dateStr = dDate.format("DD/MM");
          if (aggregated[dateStr] !== undefined) {
            aggregated[dateStr] += Number(d.estimatedValue || 0);
          }
        }
      });
    } else if (timeRange === "month") {
      // Theo tháng (4 tuần) của tháng hiện tại
      aggregated = {
        "Tuần 1": 0,
        "Tuần 2": 0,
        "Tuần 3": 0,
        "Tuần 4": 0,
      };
      damages.forEach((d) => {
        const dDate = dayjs(d.createdAt);
        if (dDate.isSame(now, "month")) {
          const date = dDate.date();
          if (date <= 7) aggregated["Tuần 1"] += Number(d.estimatedValue || 0);
          else if (date <= 14)
            aggregated["Tuần 2"] += Number(d.estimatedValue || 0);
          else if (date <= 21)
            aggregated["Tuần 3"] += Number(d.estimatedValue || 0);
          else aggregated["Tuần 4"] += Number(d.estimatedValue || 0);
        }
      });
    } else {
      // Năm (12 tháng) của năm hiện tại
      for (let i = 1; i <= 12; i++) {
        aggregated[`Tháng ${i}`] = 0;
      }
      damages.forEach((d) => {
        const dDate = dayjs(d.createdAt);
        if (dDate.isSame(now, "year")) {
          aggregated[`Tháng ${dDate.month() + 1}`] += Number(
            d.estimatedValue || 0,
          );
        }
      });
    }

    return Object.keys(aggregated).map((key) => ({
      name: key,
      value: aggregated[key],
    }));
  }, [damages, timeRange]);

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
    <div className="w-full flex flex-col gap-4 bg-[#FFFFFF] p-4 rounded-lg shadow-lg">
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
      {/* Block 4: Biểu đồ thống kê - Tạm ẩn theo yêu cầu */}
      {/* {isAdminOrManager && damages.length > 0 && (
        <Card
          title="Thống kê thiệt hại ước tính"
          className="shadow-sm rounded-xl border border-gray-100"
          extra={
            <Select
              value={timeRange}
              onChange={setTimeRange}
              options={[
                { value: "week", label: "7 ngày qua" },
                { value: "month", label: "Tháng này" },
                { value: "year", label: "Năm nay" },
              ]}
              style={{ width: 120 }}
            />
          }
        >
          <div className="w-full h-[350px] flex items-center justify-center">
            {damages.length === 0 ? (
              <Empty description="Chưa có dữ liệu thống kê" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) =>
                      new Intl.NumberFormat("vi-VN", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(val)
                    }
                  />
                  <RechartsTooltip
                    formatter={(value: any) =>
                      new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(Number(value) || 0)
                    }
                    cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Giá trị thiệt hại (VND)"
                    fill="#1677ff"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      )} */}
      {/* Statistics for Admin/Manager */}
      {isAdminOrManager &&
        resident?.reflections &&
        resident.reflections.length > 0 &&
        stats && (
          <Card className="shadow-sm rounded-xl border border-gray-100 bg-blue-50/20">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8} md={8}>
                <Statistic
                  title="Tổng số phản ánh"
                  value={stats.uniqueReflections}
                  valueStyle={{ color: "#1677ff", fontWeight: "bold" }}
                />
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Statistic
                  title="Đã xử lý"
                  value={stats.resolvedReflections}
                  valueStyle={{ color: "#3f8600", fontWeight: "bold" }}
                />
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Statistic
                  title="Bị từ chối"
                  value={stats.rejectedReflections}
                  valueStyle={{ color: "#cf1322", fontWeight: "bold" }}
                />
              </Col>
            </Row>
          </Card>
        )}

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
              {HouseTypeLabel[resident?.houseType as HouseType] || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Số tầng">
              {resident?.numberOfFloors || "0"}
            </Descriptions.Item>
            {resident?.user && (
              <Descriptions.Item label="Tài khoản liên kết">
                <Tag
                  color="blue"
                  className="font-semibold text-[13px] px-2 py-0.5 rounded-md"
                >
                  👤 {resident.user.fullName} ({resident.user.phoneNumber})
                </Tag>
              </Descriptions.Item>
            )}
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
              url={`${import.meta.env.VITE_API_URL_GEOSERVER}/tambinh/wms`}
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

      {/* Block 5: Thiệt hại liên quan */}
      {damages.length > 0 && (
        <Card
          title="Danh sách thiệt hại liên quan"
          className="shadow-sm rounded-xl border border-gray-100"
        >
          <Table
            dataSource={damages}
            columns={damageColumns}
            rowKey="id"
            pagination={false}
            size="middle"
            bordered
          />
        </Card>
      )}

      {/* Block 5.5: Phản ánh liên quan */}
      {isAdminOrManager &&
        resident?.reflections &&
        resident.reflections.length > 0 && (
          <Card
            title="Danh sách phản ánh của người dân"
            className="shadow-sm rounded-xl border border-gray-100"
          >
            <Table
              dataSource={resident.reflections}
              columns={[
                {
                  title: "Mã phản ánh",
                  dataIndex: "id",
                  width: 120,
                  render: (id: number) => (
                    <Button
                      type="link"
                      onClick={() => navigate(`/reflections/${id}`)}
                      style={{ padding: 0, fontWeight: 600 }}
                    >
                      #{id}
                    </Button>
                  ),
                },
                {
                  title: "Tiêu đề",
                  dataIndex: "title",
                  render: (text: string) => text || "Không có tiêu đề",
                },
                {
                  title: "Nội dung",
                  dataIndex: "content",
                  ellipsis: true,
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  render: (status: string) => {
                    const ReflectionStatusLabel: Record<string, string> = {
                      PENDING: "Chờ xác minh",
                      VERIFIED: "Đã xác minh",
                      ASSIGNED: "Đã giao việc",
                      IN_PROGRESS: "Đang xử lý",
                      COMPLETED: "Đã hoàn thành",
                      RESOLVED: "Đã giải quyết",
                      REJECTED: "Đã từ chối",
                    };
                    const ReflectionStatusColor: Record<string, string> = {
                      PENDING: "orange",
                      VERIFIED: "blue",
                      ASSIGNED: "cyan",
                      IN_PROGRESS: "processing",
                      COMPLETED: "success",
                      RESOLVED: "green",
                      REJECTED: "error",
                    };
                    return (
                      <Tag color={ReflectionStatusColor[status] || "default"}>
                        {ReflectionStatusLabel[status] || status}
                      </Tag>
                    );
                  },
                },
                {
                  title: "Ngày gửi",
                  dataIndex: "createdAt",
                  render: (date: string) =>
                    dayjs(date).format("DD/MM/YYYY HH:mm"),
                },
              ]}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="middle"
              bordered
            />
          </Card>
        )}


    </div>
  );
}
