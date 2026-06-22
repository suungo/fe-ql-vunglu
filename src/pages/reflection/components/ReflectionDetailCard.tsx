import React from "react";
import { Card, Divider, Image, Typography, Tag } from "antd";
import { AlertTriangle, ShieldCheck, Tag as TagIcon } from "lucide-react";
import { Category, EventType, Priority } from "../enum";

const { Title, Paragraph, Text } = Typography;

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

interface ReflectionDetailCardProps {
  reflection: any;
}

export const ReflectionDetailCard: React.FC<ReflectionDetailCardProps> = ({ reflection }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleCode = user?.role?.roleCode;
  const isAdminOrManager = roleCode === "ADMIN" || roleCode === "MANAGER";

  return (
    <Card className="rounded-2xl mb-4! shadow-sm border-slate-100 overflow-hidden">
      <div className="space-y-4">
        <div>
          <Title level={4} className="text-slate-800!">
            {reflection.title ?? reflection.content}
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

        {/* Báo cáo tuần tra */}
        {reflection.patrolReport && isAdminOrManager && (
          <div className="mt-4 bg-sky-50 border border-sky-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Text strong className="text-sky-800">
                Báo cáo từ cán bộ Tuần tra
              </Text>
            </div>
            <Paragraph className="text-sky-700 text-sm whitespace-pre-wrap mb-1">
              {reflection.patrolReport}
            </Paragraph>
            {reflection.patrolLat && (
              <Text className="text-xs text-sky-500">
                GPS: {reflection.patrolLat?.toFixed(5)},{" "}
                {reflection.patrolLng?.toFixed(5)}
              </Text>
            )}
          </div>
        )}

        {/* Ghi chú điều hành */}
        {reflection.response && (
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <Text strong className="text-slate-700 block mb-1">
              Ghi chú điều hành / Phản hồi:
            </Text>
            <Paragraph className="text-slate-600 text-sm">
              {reflection.response}
            </Paragraph>
          </div>
        )}

        {/* Lý do từ chối */}
        {reflection.rejectReason && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
            <Text strong className="text-red-700 block mb-1">
              Lý do từ chối:
            </Text>
            <Paragraph className="text-red-600 text-sm">
              {reflection.rejectReason}
            </Paragraph>
          </div>
        )}
      </div>
    </Card>
  );
};
