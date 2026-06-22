import React, { useMemo, useState, useEffect } from "react";
import { Table, Tag, Tooltip, Button } from "antd";
import { Eye, Clock, CheckCircle, XCircle, RefreshCw, Check } from "lucide-react";
import dayjs from "dayjs";
import { DispatchReportStatus } from "../interfaces";
import type { DispatchReport } from "../interfaces";

const CountdownCell: React.FC<{ item: DispatchReport }> = ({ item }) => {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (item.status !== DispatchReportStatus.PENDING || !item.expiredAt) {
      setCountdown(null);
      return;
    }

    const calculateCountdown = () => {
      const diff = new Date(item.expiredAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("Hết hạn");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [item.status, item.expiredAt]);

  if (!countdown) return null;
  if (countdown === "Hết hạn")
    return <span className="text-red-500 font-semibold text-xs">Quá hạn</span>;

  return (
    <span className="text-[10px] font-semibold text-orange-600 animate-pulse bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
      ⏱️ {countdown}
    </span>
  );
};

const TimerIcon = ({ size }: { size: number }) => (
  <span className="inline-flex items-center justify-center">
    <CheckCircle size={size} />
  </span>
);

const getStatusTag = (status: DispatchReportStatus) => {
  const map: Record<
    DispatchReportStatus,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    [DispatchReportStatus.PENDING]: {
      color: "orange",
      icon: <Clock size={12} />,
      label: "Chờ xử lý",
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
      icon: <TimerIcon size={12} />,
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
      className="flex items-center gap-1 w-fit"
    >
      {config.label}
    </Tag>
  );
};

interface DispatchTableProps {
  dataSource: DispatchReport[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewDetail: (record: DispatchReport) => void;
}

export const DispatchTable: React.FC<DispatchTableProps> = ({
  dataSource,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onViewDetail,
}) => {
  const columns = useMemo(
    () => [
      {
        title: <span className="font-bold text-slate-700">Mã yêu cầu</span>,
        dataIndex: "code",
        key: "code",
        render: (code: string) => (
          <span className="font-mono font-bold text-purple-600 text-sm">
            {code}
          </span>
        ),
      },
      {
        title: (
          <span className="font-bold text-slate-700">Tiêu đề / Phản ánh</span>
        ),
        key: "title",
        render: (_: any, record: DispatchReport) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 line-clamp-1">
                {record.title || record.reflection?.title || "Yêu cầu tuần tra"}
              </span>
            </div>
            {record.reflection && (
              <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Phản ánh: {record.reflection.content}
              </div>
            )}
          </div>
        ),
      },
      {
        title: <span className="font-bold text-slate-700">Phân công</span>,
        key: "staff",
        render: (_: any, record: DispatchReport) => (
          <div className="flex flex-col text-xs text-slate-500">
            <div>
              Giao:{" "}
              <span className="font-medium text-slate-700">
                {record.assigner?.fullName || "—"}
              </span>
            </div>
            <div>
              Nhận:{" "}
              <span className="font-bold text-slate-700">
                {record.assignee?.fullName || record.customHandler || "—"}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: <span className="font-bold text-slate-700">Thời gian tạo</span>,
        key: "assignedAt",
        render: (_: any, record: DispatchReport) => (
          <span className="text-xs text-slate-600">
            {dayjs(record.assignedAt || record.createdAt).format(
              "DD/MM/YYYY HH:mm",
            )}
          </span>
        ),
      },
      {
        title: <span className="font-bold text-slate-700">Trạng thái</span>,
        dataIndex: "status",
        key: "status",
        render: (status: DispatchReportStatus, record: DispatchReport) => (
          <div className="flex flex-col gap-1 items-start">
            {getStatusTag(status)}
            <CountdownCell item={record} />
          </div>
        ),
      },
      {
        title: <span className="font-bold text-slate-700">Hành động</span>,
        key: "actions",
        align: "center" as const,
        render: (_: any, record: DispatchReport) => (
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              shape="circle"
              icon={
                <Eye size={18} className="text-slate-500 hover:text-blue-500" />
              }
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(record);
              }}
            />
          </Tooltip>
        ),
      },
    ],
    [onViewDetail],
  );

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize: limit,
        total: total,
        onChange: onPageChange,
        hideOnSinglePage: true,
      }}
      onRow={(record) => ({
        onClick: () => onViewDetail(record),
        className: "cursor-pointer hover:bg-slate-50 transition-colors",
      })}
      locale={{ emptyText: "Không có yêu cầu nào" }}
    />
  );
};
