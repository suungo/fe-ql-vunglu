import React, { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
  WMSTileLayer,
} from "react-leaflet";

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

const patrolIcon = L.divIcon({
  className: "custom-patrol-marker",
  html: '<div style="width:28px;height:28px;background:#0ea5e9;border-radius:50%;border:4px solid #fff;box-shadow:0 2px 12px rgba(14,165,233,0.5);position:relative"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:8px;height:8px;background:#fff;border-radius:50%"></div></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -18],
});

// Component to handle routing between patrol and incident
const RoutingPath = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!from[0] || !from[1] || !to[0] || !to[1]) return;

    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [
            c[1],
            c[0],
          ]);
          setRoute(coords);
          setRouteInfo({
            distance: data.routes[0].distance,
            duration: data.routes[0].duration,
          });
        } else {
          setRoute([from, to]);
          setRouteInfo(null);
        }
      })
      .catch(() => {
        setRoute([from, to]);
        setRouteInfo(null);
      });
  }, [from[0], from[1], to[0], to[1]]);

  if (route.length === 0) return null;

  const middleIndex = Math.floor(route.length / 2);
  const middlePoint = route[middleIndex];

  return (
    <>
      <Polyline positions={route} color="#0ea5e9" weight={5} opacity={0.8} />
      {routeInfo && middlePoint && (
        <Marker
          position={middlePoint}
          icon={L.divIcon({
            className: "dummy-route-info",
            html: `<div style="background: white; padding: 4px 8px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: nowrap; font-weight: bold; color: #0ea5e9; font-size: 12px; margin-top: -10px; margin-left: -20px;">
              ${(routeInfo.distance / 1000).toFixed(1)} km - ${Math.round(routeInfo.duration / 60)} phút
            </div>`,
            iconSize: [0, 0],
          })}
        />
      )}
    </>
  );
};

// Component to handle map centering and updating size
function MapUpdater({
  center,
  patrolCoords,
}: {
  center: { lat: number; lng: number } | null;
  patrolCoords?: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size on mount for container rendering (especially inside modals)
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timeout);
  }, [map]);

  useEffect(() => {
    if (patrolCoords && patrolCoords[0] && patrolCoords[1] && center) {
      const bounds = L.latLngBounds([[center.lat, center.lng], patrolCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center?.lat && center?.lng) {
      const currentZoom = map.getZoom();
      // Nếu bản đồ đang phóng to lớn hơn mức zoom khởi tạo (14), giữ nguyên mức zoom hiện tại của người dùng.
      // Ngược lại (khi mới mở hoặc đang ở zoom nhỏ), tự động phóng lên zoom 16.
      const targetZoom = currentZoom > 14 ? currentZoom : 16;
      map.flyTo([center.lat, center.lng], targetZoom);
    }
  }, [center?.lat, center?.lng, patrolCoords?.[0], patrolCoords?.[1], map]);

  return null;
}

// Component to handle click events on the map for editing
function LocationMarker({
  isEditable,
  onLocationSelect,
}: {
  isEditable?: boolean;
  onLocationSelect?: (latlng: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number } }) {
      if (isEditable && onLocationSelect) {
        onLocationSelect(e.latlng);
      }
    },
  });
  return null;
}

interface CommonMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  maxZoom?: number;
  markerPosition?: { lat: number; lng: number } | null;
  markerPopupText?: string;
  isEditable?: boolean;
  onLocationSelect?: (latlng: { lat: number; lng: number }) => void;
  patrolPosition?: { lat: number; lng: number } | null;
  showRoute?: boolean;
  style?: React.CSSProperties;
}

export const CommonMap: React.FC<CommonMapProps> = ({
  center,
  zoom = 14,
  maxZoom = 20,
  markerPosition = null,
  markerPopupText,
  isEditable = false,
  onLocationSelect,
  patrolPosition = null,
  showRoute = false,
  style = { height: "100%", width: "100%" },
}) => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const roleCode = currentUser?.role?.roleCode;
  const canSeeRoute = roleCode === "MANAGER" || roleCode === "PATROL";

  const incidentCoords: [number, number] | null = markerPosition
    ? [markerPosition.lat, markerPosition.lng]
    : null;

  const patrolCoords: [number, number] | null = patrolPosition
    ? [patrolPosition.lat, patrolPosition.lng]
    : null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      maxZoom={maxZoom}
      style={style}
    >
      {/* Nền: ảnh vệ tinh Google (tăng maxNativeZoom lên 20 để hiển thị ảnh sắc nét hơn ở mức zoom cao) */}
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        attribution="Google Satellite"
        maxZoom={maxZoom}
        maxNativeZoom={20}
      />
      {/* Tên đường từ Google Maps */}
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
        attribution="Google Maps"
        opacity={1}
        maxZoom={maxZoom}
      />
      {/* Ranh giới phường từ GeoServer */}
      {/* <WMSTileLayer
        url={`${import.meta.env.VITE_API_URL_GEOSERVER}/tambinh/wms`}
        layers="tambinh:tam-binh_map"
        format="image/png"
        transparent={true}
        maxZoom={maxZoom}
        version="1.1.0"
        attribution="&copy; GeoServer | Ranh giới phường"
        opacity={0.75}
      /> */}
      {/* Ranh giới khu phố từ GeoServer */}
      <WMSTileLayer
        url={`${import.meta.env.VITE_API_URL_GEOSERVER}/tambinh/wms`}
        layers="tambinh:ranhkhupho2"
        format="image/png"
        transparent={true}
        maxZoom={maxZoom}
        version="1.1.0"
        attribution="&copy; GeoServer | Ranh khu phố"
        opacity={0.8}
      />

      {/* Incident Marker */}
      {incidentCoords && (
        <Marker position={incidentCoords}>
          {markerPopupText && <Popup>{markerPopupText}</Popup>}
        </Marker>
      )}

      {/* Map Recenter / Update Handler */}
      <MapUpdater
        center={center}
        patrolCoords={canSeeRoute ? patrolCoords : null}
      />

      {/* Location click handler */}
      <LocationMarker
        isEditable={isEditable}
        onLocationSelect={onLocationSelect}
      />

      {/* Realtime Patrol Path */}
      {showRoute && canSeeRoute && patrolCoords && incidentCoords && (
        <RoutingPath from={patrolCoords} to={incidentCoords} />
      )}

      {/* Realtime Patrol Marker */}
      {canSeeRoute && patrolCoords && (
        <Marker position={patrolCoords} icon={patrolIcon}>
          <Popup>
            <div>
              <strong>Cán bộ tuần tra</strong>
              <p className="text-xs text-slate-500 m-0">Vị trí hiện tại</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};
