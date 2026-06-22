import { Modal, Tag, Typography, DatePicker } from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, Clock } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import { useQuery } from "@tanstack/react-query";
import { getProfileApi } from "@/pages/profile/api";
import { Role } from "@/enums";
import { UserProfileModal } from "../components/UserProfileModal";
import { io, type Socket } from "socket.io-client";

dayjs.locale("vi");
import {
  CircleMarker,
  LayersControl,
  MapContainer,
  Popup,
  TileLayer,
  WMSTileLayer,
} from "react-leaflet";
import { BASE_URL } from "@/apis";
import NewsFeed from "../components/NewsFeed";
import { ReflectionStatus } from "../../reflection/enum";
import type { Reflection } from "../../reflection/interfaces";

const { Title } = Typography;

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const mapCenter: [number, number] = [10.865, 106.731];

const GEOSERVER_URL = `${import.meta.env.VITE_API_URL_GEOSERVER}/tambinh/wms`;
const GEOSERVER_LAYER = "tambinh:tam-binh_map";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "LOW":
      return "#22c55e"; // Xanh lá
    case "MEDIUM":
      return "#eab308"; // Vàng
    case "HIGH":
      return "#ef4444"; // Đỏ
    default:
      return "#10b981";
  }
};

const obfuscateName = (name?: string) => {
  if (!name) return "Ẩn danh";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name.charAt(0) + "***";
  return `${parts[0]} *** ${parts[parts.length - 1].charAt(0)}***`;
};

const obfuscateAddress = (address?: string) => {
  if (!address) return "";
  const parts = address.split(",");
  if (parts.length > 1) {
    return `***, ${parts.slice(1).join(",").trim()}`;
  }
  const half = Math.floor(address.length / 2);
  return "***" + address.substring(half);
};

export default function MapPage() {
  const [resolvedReflections, setResolvedReflections] = useState<Reflection[]>(
    [],
  );
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const canViewProfile =
    profileData?.role?.roleCode === Role.ADMIN ||
    profileData?.role?.roleCode === Role.MANAGER;
  const [selectedMonthYear, setSelectedMonthYear] =
    useState<dayjs.Dayjs | null>(dayjs());

  const filteredReflections = useMemo(() => {
    if (!selectedMonthYear) return resolvedReflections;
    const year = selectedMonthYear.year();
    const month = selectedMonthYear.month(); // 0-11
    return resolvedReflections.filter((r) => {
      const d = dayjs(r.createdAt);
      return d.year() === year && d.month() === month;
    });
  }, [resolvedReflections, selectedMonthYear]);

  const mapStats = useMemo(() => {
    const total = filteredReflections.length;
    const resolved = filteredReflections.filter(
      (r) => r.status === ReflectionStatus.RESOLVED,
    ).length;
    const inProgress = filteredReflections.filter(
      (r) =>
        r.status === ReflectionStatus.IN_PROGRESS ||
        r.status === ReflectionStatus.ASSIGNED ||
        r.status === ReflectionStatus.VERIFIED,
    ).length;
    return { total, resolved, inProgress };
  }, [filteredReflections]);

  const getStatusTag = (status: ReflectionStatus) => {
    switch (status) {
      case ReflectionStatus.RESOLVED:
        return <Tag color="green">Đã giải quyết</Tag>;
      case ReflectionStatus.IN_PROGRESS:
        return <Tag color="blue">Đang xử lý</Tag>;
      default:
        return <Tag color="orange">Chờ xử lý</Tag>;
    }
  };

  useEffect(() => {
    const fetchReflections = () => {
      BASE_URL.get("/reports", {
        params: { isMap: true, limit: 100 },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
        .then((res) => {
          setResolvedReflections(res.data?.data || res.data || []);
        })
        .catch((err) => console.error("Lỗi khi tải sự kiện bản đồ:", err));
    };

    fetchReflections();

    // Thiết lập kết nối Socket.io để cập nhật trạng thái thời gian thực
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const socket: Socket = io(`${socketUrl}/notifications`, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("newNotification", (noti: any) => {
      if (
        noti?.type?.startsWith("DISPATCH_") ||
        noti?.type?.startsWith("PATROL_") ||
        noti?.type?.startsWith("REFLECTION_") ||
        noti?.title?.toLowerCase().includes("phản ánh") ||
        noti?.content?.toLowerCase().includes("phản ánh") ||
        noti?.title?.toLowerCase().includes("tuần tra") ||
        noti?.content?.toLowerCase().includes("tuần tra") ||
        noti?.title?.toLowerCase().includes("điều chuyển") ||
        noti?.content?.toLowerCase().includes("điều chuyển")
      ) {
        fetchReflections();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6 p-4 bg-[#FFFFFF] shadow-md rounded-lg">
      <UserProfileModal
        userId={selectedUserId}
        open={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <Title level={3} className="m-0! text-slate-800 text-lg! md:text-2xl">
          Bản đồ cảnh báo sự cố đô thị
        </Title>
        <div className="flex gap-3 text-[10px] md:text-sm bg-white/50 p-2 rounded-lg border border-white">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 block" />{" "}
            Thấp
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block" />{" "}
            Trung bình
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" /> Cao
          </div>
        </div>
      </div>
      {/* Filter and Stats */}
      {!isMobile && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 text-sm">
              Lọc theo thời gian:
            </span>
            <DatePicker
              picker="month"
              format="MM/YYYY"
              placeholder="Chọn tháng, năm"
              value={selectedMonthYear}
              onChange={(val) => setSelectedMonthYear(val)}
              allowClear
              className="w-48"
              locale={locale}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Tổng số:
              </span>
              <span className="text-sm font-bold text-blue-600">
                {mapStats.total}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Đã khắc phục:
              </span>
              <span className="text-sm font-bold text-green-600">
                {mapStats.resolved}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                Đang xử lý:
              </span>
              <span className="text-sm font-bold text-blue-500">
                {mapStats.inProgress}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={14}
          maxZoom={20}
          className="h-[350px] md:h-[700px] w-full"
          scrollWheelZoom={true}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Bản đồ Sáng (Carto)">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                maxZoom={20}
                subdomains="abcd"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Google Hybrid (Vệ tinh & Đường)">
              <TileLayer
                attribution="Google Hybrid"
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={20}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.Overlay
              checked
              name="🗺️ Bản đồ chi tiết Tâm Bình (WMS)"
            >
              <WMSTileLayer
                url={GEOSERVER_URL}
                layers={GEOSERVER_LAYER}
                format="image/png"
                transparent={true}
                version="1.1.0"
                attribution="&copy; GeoServer | Tâm Bình"
                opacity={0.75}
                maxZoom={20}
              />
            </LayersControl.Overlay>

            <LayersControl.Overlay name="🚦 Giao thông Tâm Bình">
              <WMSTileLayer
                url={GEOSERVER_URL}
                layers="tambinh:giaothongTamBinh1"
                format="image/png"
                transparent={true}
                version="1.1.0"
                attribution="&copy; GeoServer | Giao thông"
                opacity={0.8}
                maxZoom={20}
              />
            </LayersControl.Overlay>

            <LayersControl.Overlay name="🏘️ Ranh khu phố Tâm Bình">
              <WMSTileLayer
                url={GEOSERVER_URL}
                layers="tambinh:ranhkhupho2"
                format="image/png"
                transparent={true}
                version="1.1.0"
                attribution="&copy; GeoServer | Ranh khu phố"
                opacity={0.8}
                maxZoom={20}
              />
            </LayersControl.Overlay>
          </LayersControl>

          {/* Markers */}
          {filteredReflections.map(
            (r) =>
              r.lat &&
              r.lng && (
                <CircleMarker
                  key={r.id}
                  center={[r.lat, r.lng]}
                  pathOptions={{
                    color:
                      r.status === ReflectionStatus.RESOLVED
                        ? "#22c55e"
                        : "#3b82f6",
                    weight: 3,
                    fillColor: getPriorityColor(r.priority),
                    fillOpacity: 0.8,
                  }}
                  radius={12}
                >
                  <Popup>
                    <div className="p-0.5 max-w-[180px] sm:max-w-[360px]">
                      <div className="flex flex-col gap-1.5 mb-2 pb-2 border-b border-slate-100">
                        <div
                          className={`flex ${isMobile ? "justify-start" : "flex-row items-center justify-between"} gap-1.5`}
                        >
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`h-6 w-6 ${r.status === ReflectionStatus.RESOLVED ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"} rounded-full flex items-center justify-center shrink-0`}
                            >
                              {r.status === ReflectionStatus.RESOLVED ? (
                                <Check size={13} />
                              ) : (
                                <Clock size={13} />
                              )}
                            </div>
                            <h4 className="font-bold text-[13px] m-0 text-slate-800 line-clamp-1">
                              {r.status === ReflectionStatus.RESOLVED
                                ? "Đã khắc phục"
                                : "Đang xử lý"}
                            </h4>
                          </div>
                          {!isMobile && (
                            <div className="flex shrink-0 transform scale-90 origin-right">
                              {getStatusTag(r.status as ReflectionStatus)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm">
                          <p className="font-bold text-slate-700 mb-1">
                            {r.title}
                          </p>
                          <p className="text-slate-600 italic">"{r.content}"</p>
                        </div>
                        {!isMobile &&
                          r.status === ReflectionStatus.RESOLVED && (
                            <div className="bg-green-50 p-2 rounded-lg border border-green-100 text-sm">
                              <p className="font-medium text-green-700 mb-1">
                                Kết quả xử lý:
                              </p>
                              <p className="text-green-800">
                                {r.response ||
                                  "Đã hoàn thành công tác xử lý tại thực địa."}
                              </p>
                            </div>
                          )}
                        <div className="flex flex-col gap-1 pt-1 text-xs text-slate-400">
                          <span
                            className={
                              canViewProfile
                                ? "cursor-pointer hover:text-blue-500 font-semibold transition-colors"
                                : ""
                            }
                            onClick={(e) => {
                              if (canViewProfile && r.user?.id) {
                                e.stopPropagation();
                                setSelectedUserId(r.user.id);
                              }
                            }}
                          >
                            👤{" "}
                            {canViewProfile
                              ? r.user?.fullName || "Ẩn danh"
                              : obfuscateName(r.user?.fullName)}
                          </span>
                          <span>
                            📍{" "}
                            {r.address
                              ? obfuscateAddress(r.address)
                              : `${r.lat}, ${r.lng}`}
                          </span>
                          <span>
                            ⏰{" "}
                            {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ),
          )}
        </MapContainer>
      </div>

      <NewsFeed />
    </div>
  );
}
