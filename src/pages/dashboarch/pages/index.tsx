import { Modal, Tag, Typography } from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Car, Check, Clock, CloudRain, Info, Waves } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  LayersControl,
  MapContainer,
  Popup,
  TileLayer,
  WMSTileLayer,
  useMapEvents,
} from "react-leaflet";

const { Title } = Typography;

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const mapCenter: [number, number] = [10.865, 106.731];

const GEOSERVER_URL = `${import.meta.env.VITE_API_URL_GEOSERVER}/geoserver/tambinh/wms`;
const GEOSERVER_LAYER = "tambinh:tam-binh_map";
const GEOSERVER_QUERY_LAYER = "tambinh:ranhphuongTamBinh";

// ========== WMS GetFeatureInfo khi click ==========

/** Parse GeoServer text/plain response:
 *  "key = value\n" → { key: value }
 */
interface GeoServerProperties {
  [key: string]: string;
}

function parseGeoServerText(text: string): GeoServerProperties {
  const result: GeoServerProperties = {};
  text.split("\n").forEach((line) => {
    const sep = line.indexOf("=");
    if (sep > 0) {
      const key = line.slice(0, sep).trim();
      const val = line.slice(sep + 1).trim();
      if (key && val) result[key] = val;
    }
  });
  return result;
}

function WmsClickHandler({
  wmsUrl,
  displayLayer,
  queryLayer,
}: {
  wmsUrl: string;
  displayLayer: string;
  queryLayer: string;
}) {
  const popupRef = useRef<ReturnType<typeof L.popup> | null>(null);

  const map = useMapEvents({
    click: async (e: { latlng: { lat: number; lng: number } }) => {
      const size = map.getSize();
      const bounds = map.getBounds();
      const point = map.latLngToContainerPoint(e.latlng);

      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ].join(",");

      // Ưu tiên dùng application/json để tránh lỗi mã hóa tiếng Việt
      const params = new URLSearchParams({
        service: "WMS",
        version: "1.1.0",
        request: "GetFeatureInfo",
        layers: displayLayer,
        query_layers: queryLayer,
        info_format: "application/json", // Dùng JSON chuẩn hơn text/plain
        feature_count: "1",
        x: String(Math.round(point.x)),
        y: String(Math.round(point.y)),
        bbox,
        width: String(size.x),
        height: String(size.y),
        srs: "EPSG:4326",
      });

      if (popupRef.current) popupRef.current.remove();
      const loadingPopup = L.popup({ closeButton: false })
        .setLatLng(e.latlng)
        .setContent(
          `<div style="font-family:'Inter', sans-serif;font-size:13px;color:#6b7280;">⏳ Đang tải...</div>`,
        )
        .openOn(map);
      popupRef.current = loadingPopup;

      try {
        const res = await fetch(`${wmsUrl}?${params.toString()}`);
        const jsonData = await res.json();

        if (popupRef.current) popupRef.current.remove();

        if (jsonData?.features?.length > 0) {
          const props = jsonData.features[0].properties;
          const tenDvhc =
            props?.ten_dvhc ??
            props?.TEN_DVHC ??
            props?.Ten_DVHC ??
            props?.name ??
            "Không rõ";

          const popup = L.popup({ maxWidth: 300 })
            .setLatLng(e.latlng)
            .setContent(
              `<div style="font-family:'Inter', sans-serif;padding:4px 2px;">
                <div style="font-size:11px;color:#6b7280;margin-bottom:6px;
                  letter-spacing:.5px;text-transform:uppercase;font-weight:500;">
                  📍 Đơn vị hành chính
                </div>
                <div style="font-size:18px;font-weight:700;color:#1d4ed8;line-height:1.2;">
                  ${tenDvhc}
                </div>
              </div>`,
            )
            .openOn(map);
          popupRef.current = popup;
        } else {
          // Fallback sang text/plain nếu JSON không có data (hiếm gặp)
          params.set("info_format", "text/plain");
          const resText = await fetch(`${wmsUrl}?${params.toString()}`);
          const buffer = await resText.arrayBuffer();
          const text = new TextDecoder("utf-8").decode(buffer);

          if (text.includes("ten_dvhc") || text.includes("TEN_DVHC")) {
            const props = parseGeoServerText(text);
            const tenDvhc =
              props["ten_dvhc"] || props["TEN_DVHC"] || "Không rõ";
            const popup = L.popup({ maxWidth: 300 })
              .setLatLng(e.latlng)
              .setContent(
                `<div style="font-family:'Inter', sans-serif;padding:4px 2px;">
                  <div style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;">📍 Đơn vị hành chính</div>
                  <div style="font-size:18px;font-weight:700;color:#1d4ed8;">${tenDvhc}</div>
                </div>`,
              )
              .openOn(map);
            popupRef.current = popup;
          } else {
            const popup = L.popup({ maxWidth: 240 })
              .setLatLng(e.latlng)
              .setContent(
                `<div style="font-family:'Inter', sans-serif;font-size:13px;color:#9ca3af;">ℹ️ Không có dữ liệu tại vị trí này.</div>`,
              )
              .openOn(map);
            popupRef.current = popup;
          }
        }
      } catch (err: unknown) {
        console.error("[GeoServer] Lỗi:", err);
        if (popupRef.current) popupRef.current.remove();
      }
    },
  });

  return null;
}

import NewsFeed from "../components/NewsFeed";
import OtherInfo from "../components/OtherInfo";
import RainInfo from "../components/RainInfo";
import TideInfo from "../components/TideInfo";
import TrafficInfo from "../components/Tranficlnfo";

import { ReflectionStatus } from "../../reflection/enum";
import type { Reflection } from "../../reflection/interfaces";

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

export default function Dashboard() {
  const [resolvedReflections, setResolvedReflections] = useState<Reflection[]>(
    [],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInfo, setCurrentInfo] = useState<{
    title: string;
    content: React.ReactNode;
  } | null>(null);
  const [modalType, setModalType] = useState<
    "rain" | "tide" | "traffic" | "other" | null
  >(null);

  useEffect(() => {
    // Lấy dữ liệu các sự kiện phục vụ bản đồ (isMap=true)
    fetch(`http://localhost:3001/api/reports?isMap=true&limit=100`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.statusCode === 200) {
          setResolvedReflections(res.data);
        }
      })
      .catch((err) => console.error("Lỗi khi tải sự kiện bản đồ:", err));
  }, []);

  const handleOpenModal = (
    type: "rain" | "tide" | "traffic" | "other",
    title: string,
    content: string,
  ) => {
    setModalType(type);
    setCurrentInfo({ title, content });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentInfo(null);
    setModalType(null);
  };

  const renderModalContent = () => {
    if (modalType === "rain") return <RainInfo />;
    if (modalType === "tide") return <TideInfo />;
    if (modalType === "traffic") return <TrafficInfo />;
    if (modalType === "other") return <OtherInfo />;
    return (
      <>
        <p>{currentInfo?.content}</p>
        <p className="text-slate-500 italic mt-4">
          Nội dung chi tiết đang được cập nhật...
        </p>
      </>
    );
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <Title level={3} className="!m-0 text-slate-800 !text-lg md:!text-2xl">
          Bản đồ cảnh báo sự cố đô thị
        </Title>
        <div className="flex gap-3 text-[10px] md:text-sm bg-white/50 p-2 rounded-lg border border-white">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 block" /> Ưu
            tiên thấp
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block" />{" "}
            Trung bình
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" /> Khẩn
            cấp
          </div>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
  
        <span>
          Bản đồ hiển thị <strong>Các sự kiện đang xử lý và đã hoàn tất</strong>
          . Màu sắc thể hiện mức độ ưu tiên của sự cố.
        </span>
      </div>

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
            {/* Base: Carto Light */}
            <LayersControl.BaseLayer checked name="Bản đồ Sáng (Carto)">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                maxZoom={20}
                subdomains="abcd"
              />
            </LayersControl.BaseLayer>

            {/* Base: Google Hybrid */}
            <LayersControl.BaseLayer name="Google Hybrid (Vệ tinh & Đường)">
              <TileLayer
                attribution="Google Hybrid"
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>

            {/* Base: OSM */}
            <LayersControl.BaseLayer name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={20}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>

            {/* Overlay: GeoServer WMS */}
            <LayersControl.Overlay checked name="🗺️ Bản đồ chi tiết Tâm Bình (WMS)">
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

            {/* Overlay: Giao thông Tâm Bình */}
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

            {/* Overlay: Ranh khu phố Tâm Bình */}
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

          {/* WMS Click Handler — lấy thông tin đơn vị hành chính khi click */}
          {/* <WmsClickHandler
            wmsUrl={GEOSERVER_URL}
            displayLayer={GEOSERVER_LAYER}
            queryLayer={GEOSERVER_QUERY_LAYER}
          /> */}

          {/* Markers */}
          {resolvedReflections.map(            (r) =>
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
                    <div className="p-1 min-w-[250px]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-8 w-8 ${r.status === ReflectionStatus.RESOLVED ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"} rounded-full flex items-center justify-center`}
                          >
                            {r.status === ReflectionStatus.RESOLVED ? (
                              <Check size={18} />
                            ) : (
                              <Clock size={18} />
                            )}
                          </div>
                          <h3 className="font-bold text-base m-0 text-slate-800">
                            {r.status === ReflectionStatus.RESOLVED
                              ? "Sự cố đã khắc phục"
                              : "Sự cố đang xử lý"}
                          </h3>
                        </div>
                        <Tag
                          color={
                            r.status === ReflectionStatus.RESOLVED
                              ? "green"
                              : "blue"
                          }
                        >
                          {r.status === ReflectionStatus.RESOLVED
                            ? "Xong"
                            : "Đang xử lý"}
                        </Tag>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm">
                          <p className="font-bold text-slate-700 mb-1">
                            {r.title}
                          </p>
                          <p className="text-slate-600 italic">"{r.content}"</p>
                        </div>
                        {r.status === ReflectionStatus.RESOLVED && (
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
                          <span>📍 {r.address || `${r.lat}, ${r.lng}`}</span>
                          <span>
                            ⏰ {new Date(r.createdAt).toLocaleString("vi-VN")}
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() =>
            handleOpenModal("rain", "Thông tin Mưa", "Chi tiết về lượng mưa...")
          }
          className="h-20 cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 shadow-sm flex flex-col items-center justify-center gap-1 text-white transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <CloudRain size={24} />
          <span className="text-sm font-semibold">Mưa</span>
        </div>
        <div
          onClick={() =>
            handleOpenModal("tide", "Triều Cường", "Lịch triều cường...")
          }
          className="h-20 cursor-pointer rounded-xl bg-cyan-600 hover:bg-cyan-700 shadow-sm flex flex-col items-center justify-center gap-1 text-white transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Waves size={24} />
          <span className="text-sm font-semibold">Triều Cường</span>
        </div>
        <div
          onClick={() =>
            handleOpenModal(
              "traffic",
              "Giao Thông & Tuyến Đường",
              "Các tuyến đường bị ngập...",
            )
          }
          className="h-20 cursor-pointer rounded-xl bg-amber-500 hover:bg-amber-600 shadow-sm flex flex-col items-center justify-center gap-1 text-white transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Car size={24} />
          <span className="text-sm font-semibold">Giao Thông</span>
        </div>
        <div
          onClick={() =>
            handleOpenModal("other", "Thông Tin Khác", "Các thông báo khác...")
          }
          className="h-20 cursor-pointer rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex flex-col items-center justify-center gap-1 text-slate-700 transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Info size={24} />
          <span className="text-sm font-semibold">Thông Tin Khác</span>
        </div>
      </div>

      <NewsFeed />

      <Modal
        title={currentInfo?.title}
        open={isModalOpen}
        onOk={handleCloseModal}
        onCancel={handleCloseModal}
        width={800}
        footer={null}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}
