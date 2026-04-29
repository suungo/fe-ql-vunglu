import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Empty,
  Image,
  Spin,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Tag as TagIcon,
  User,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, WMSTileLayer } from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";
import { getReflectionApi } from "../api";
import { Category, EventType, Priority, ReflectionStatus } from "../enum";

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

export default function DetailReflection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["reflection", id],
    queryFn: () => getReflectionApi(Number(id)),
    enabled: !!id,
  });

  const reflection = data?.data;

  const getStatusTag = (status?: ReflectionStatus) => {
    switch (status) {
      case ReflectionStatus.PENDING:
        return (
          <Tag color="orange" className="px-3 py-1 text-sm font-medium">
            Đang chờ xử lý
          </Tag>
        );
      case ReflectionStatus.IN_PROGRESS:
        return (
          <Tag color="blue" className="px-3 py-1 text-sm font-medium">
            Đang xử lý
          </Tag>
        );
      case ReflectionStatus.RESOLVED:
        return (
          <Tag color="green" className="px-3 py-1 text-sm font-medium">
            Đã xử lý
          </Tag>
        );
      case ReflectionStatus.REJECTED:
        return (
          <Tag color="red" className="px-3 py-1 text-sm font-medium">
            Từ chối
          </Tag>
        );
      default:
        return (
          <Tag color="default" className="px-3 py-1 text-sm font-medium">
            Mới
          </Tag>
        );
    }
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
          {reflection.status === ReflectionStatus.PENDING && (
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
                  {reflection.content}
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
            </div>
          </Card>

          {/* Map Section */}
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
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <WMSTileLayer
                    url="http://localhost:8000/geoserver/tambinh/wms"
                    layers="tambinh:tam-binh_map"
                    format="image/png"
                    transparent={true}
                    opacity={0.7}
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

        {/* Sidebar Info */}
        <div className="space-y-6">
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

          {/* Response Section (If any) */}
          <Card
            title="Đang được xử lý bởi"
            className="rounded-2xl shadow-sm border-slate-100"
          >
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck size={32} className="text-slate-300" />
              </div>
              <Text type="secondary">
                Phản ánh này đang trong trạng thái{" "}
                {getStatusTag(reflection.status).props.children}
              </Text>
              <Paragraph className="mt-4 text-sm text-slate-500 italic">
                Cơ quan chức năng sẽ phản hồi sớm nhất có thể.
              </Paragraph>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
