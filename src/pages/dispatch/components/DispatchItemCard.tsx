import React, { useEffect, useState } from "react";
import { Tag, Tooltip, Button } from "antd";
import dayjs from "dayjs";
import {
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  RefreshCw,
  Check,
  AlertTriangle,
  User,
  Eye,
} from "lucide-react";
import {
  DispatchReportStatus,
  DispatchReportType,
  type DispatchReport,
} from "../interfaces";

interface DispatchItemCardProps {
  item: DispatchReport;
  onClick: () => void;
  onViewDetail: () => void;
}

export const DispatchItemCard: React.FC<DispatchItemCardProps> = ({
  item,
  onClick,
  onViewDetail,
}) => {
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isExpiredVisual, setIsExpiredVisual] = useState(false);

  useEffect(() => {
    if (item.status !== DispatchReportStatus.PENDING) {
      setCountdown(null);
      setIsExpiredVisual(false);
      return;
    }

    const calculateCountdown = () => {
      const diff = new Date(item.expiredAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        setIsExpiredVisual(true);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
      setIsExpiredVisual(false);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [item.status, item.expiredAt]);

  const getStatusTag = (status: DispatchReportStatus) => {
    const map: Record<
      DispatchReportStatus,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      [DispatchReportStatus.PENDING]: {
        color: "orange",
        icon: <Clock size={12} />,
        label: "Chờ xác nhận",
      },
      [DispatchReportStatus.ACCEPTED]: {
        color: "cyan",
        icon: <CheckCircle size={12} />,
        label: "Đã xác nhận",
      },
      [DispatchReportStatus.REJECTED]: {
        color: "red",
        icon: <XCircle size={12} />,
        label: "Từ chối",
      },
      [DispatchReportStatus.EXPIRED]: {
        color: "default",
        icon: <Timer size={12} />,
        label: "Hết hạn",
      },
      [DispatchReportStatus.IN_PROGRESS]: {
        color: "processing",
        icon: <RefreshCw size={12} />,
        label: "Đang xử lý",
      },
      [DispatchReportStatus.COMPLETED]: {
        color: "green",
        icon: <Check size={12} />,
        label: "Hoàn thành",
      },
      [DispatchReportStatus.CANCELLED]: {
        color: "default",
        icon: <XCircle size={12} />,
        label: "Đã hủy",
      },
    };
    const config = map[status] || {
      color: "default",
      icon: null,
      label: status,
    };
    return (
      <Tag
        color={config.color}
        icon={config.icon}
        className="flex items-center gap-1"
      >
        {config.label}
      </Tag>
    );
  };

  const getTypeTag = (type: DispatchReportType) => {
    if (type === DispatchReportType.MANAGER_TO_INSPECTOR)
      return <Tag color="purple">QL → Hậu kiểm</Tag>;
    return <Tag color="blue">Hậu kiểm → Tuần tra</Tag>;
  };

  return (
    <div
      className={`w-full bg-white p-4 rounded-xl border transition-all cursor-pointer group flex items-center gap-4 ${
        isExpiredVisual
          ? "border-red-200 bg-red-50/50"
          : "border-slate-200 hover:border-purple-300 hover:shadow-md"
      }`}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          item.type === DispatchReportType.MANAGER_TO_INSPECTOR
            ? "bg-purple-100"
            : "bg-blue-100"
        }`}
      >
        <ArrowRightLeft
          size={22}
          className={
            item.type === DispatchReportType.MANAGER_TO_INSPECTOR
              ? "text-purple-500"
              : "text-blue-500"
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <div className="md:col-span-4">
          <div className="font-semibold text-slate-800 line-clamp-1">
            {item.title || item.reflection?.title || "Điều chuyển"}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <User size={12} />
            <span>{item.assigner?.fullName || "—"}</span>
            <span>→</span>
            <span className="font-semibold text-slate-700">
              {item.assignee?.fullName || "—"}
            </span>
          </div>
        </div>

        <div className="md:col-span-4 flex items-center gap-2 flex-wrap">
          {getStatusTag(item.status)}
          {getTypeTag(item.type)}
          {countdown && (
            <Tag
              color="volcano"
              icon={<Timer size={12} />}
              className="flex items-center gap-1 animate-pulse"
            >
              {countdown}
            </Tag>
          )}
          {isExpiredVisual && (
            <Tag
              color="red"
              icon={<AlertTriangle size={12} />}
              className="flex items-center gap-1"
            >
              Quá hạn
            </Tag>
          )}
        </div>

        <div className="md:col-span-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}
          </span>
          <span className="text-xs text-slate-400 italic">{item.code}</span>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 shrink-0 pl-2 border-l border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            shape="circle"
            icon={<Eye size={18} className="text-slate-400" />}
            onClick={onViewDetail}
          />
        </Tooltip>
      </div>
    </div>
  );
};
