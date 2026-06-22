import React from "react";
import { Card, Typography } from "antd";
import { MapPin } from "lucide-react";
import { CommonMap } from "@/components/CommonMap";

const { Text } = Typography;

interface ReflectionMapProps {
  reflection: any;
}

export const ReflectionMap: React.FC<ReflectionMapProps> = ({ reflection }) => {
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <span>Vị trí phản ánh</span>
        </div>
      }
      className="rounded-2xl shadow-sm border-slate-100 overflow-hidden"
    >
      <div
        className="mb-4 text-slate-600 flex items-start gap-2 cursor-pointer hover:text-blue-500 transition-colors"
        onClick={() =>
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${reflection.lat},${reflection.lng}`,
            "_blank",
          )
        }
        title="Click để xem bản đồ"
      >
        <MapPin size={16} className="mt-1 shrink-0 text-red-500" />
        <span>
          {reflection.address || `${reflection.lat}, ${reflection.lng}`}
        </span>
      </div>
      <div className="h-[300px] md:h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow">
        {reflection.lat && reflection.lng ? (
          <CommonMap
            center={{ lat: reflection.lat, lng: reflection.lng }}
            zoom={16}
            maxZoom={20}
            markerPosition={{ lat: reflection.lat, lng: reflection.lng }}
            markerPopupText={reflection.address}
            patrolPosition={
              reflection.patrolLat && reflection.patrolLng
                ? { lat: reflection.patrolLat, lng: reflection.patrolLng }
                : null
            }
            showRoute={true}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-50">
            <Text type="secondary">Không có thông tin tọa độ</Text>
          </div>
        )}
      </div>
    </Card>
  );
};
