import { DatePicker, Empty, Spin, Card, Typography, Button } from "antd";
import { Download } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Role } from "@/enums";
import { getReports, getDashboardStats } from "../api/statisticsApi";
import type { Reflection } from "../../reflection/interfaces";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

import OverviewStats from "../components/OverviewStats";
import DetailedStats from "../components/DetailedStats";
import ActivityStats from "../components/ActivityStats";
import { useStatisticsData } from "../hooks/useStatisticsData";
import { handleExportExcel } from "../utils/exportExcel";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function StatisticsPage() {
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >([dayjs(), dayjs()]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleCode = user?.role?.roleCode;
  const isAdminOrManager = roleCode === Role.ADMIN || roleCode === Role.MANAGER;

  useEffect(() => {
    if (isAdminOrManager) {
      setIsStatsLoading(true);
      Promise.all([
        getReports(1000),
        getDashboardStats(),
      ])
        .then(([reportsRes, statsRes]) => {
          setAllReflections(reportsRes.data?.data || []);
          if (statsRes.data?.data) {
            setDashboardStats(statsRes.data.data);
          }
        })
        .catch((err) => console.error("Lỗi khi tải dữ liệu thống kê:", err))
        .finally(() => setIsStatsLoading(false));
    }
  }, [isAdminOrManager]);

  useEffect(() => {
    import("socket.io-client").then(({ io }) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const socketUrl =
          import.meta.env.VITE_API_URL || "http://localhost:3000";
        const socket = io(`${socketUrl}/notifications`, {
          auth: { token },
          transports: ["websocket"],
        });

        socket.on("activeUsersCountUpdated", (count: number) => {
          setDashboardStats((prev: any) => {
            const currentOnline = prev.activeAccounts[0].value;
            const currentOffline = prev.activeAccounts[1].value;
            const totalUsers = currentOnline + currentOffline;

            return {
              ...prev,
              activeAccounts: [
                { ...prev.activeAccounts[0], value: count },
                {
                  ...prev.activeAccounts[1],
                  value: Math.max(0, totalUsers - count),
                },
              ],
            };
          });
        });

        return () => {
          socket.disconnect();
        };
      }
    });
  }, []);

  const {
    filteredStatsReflections,
    statsData,
    categoryData,
    priorityData,
    eventTypeData,
  } = useStatisticsData(allReflections, dateRange);

  const [visitView, setVisitView] = useState<"day" | "month" | "year">("month");

  const [dashboardStats, setDashboardStats] = useState<any>({
    visits: { day: [], month: [], year: [] },
    activeAccounts: [
      { name: "Đang hoạt động", value: 0, color: "#10b981" },
      { name: "Ngoại tuyến", value: 0, color: "#cbd5e1" },
    ],
  });

  const onExport = () => {
    handleExportExcel({
      filteredStatsReflections,
      categoryData,
      priorityData,
      eventTypeData,
      dateRange,
    });
  };

  if (!isAdminOrManager) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold">
        Bạn không có quyền truy cập chức năng này.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-[#FFFFFF] rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <Title level={3} className="m-0! text-slate-800 text-lg! md:text-2xl">
          Thống kê phản ánh
        </Title>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="primary"
            icon={<Download size={16} />}
            onClick={onExport}
            disabled={filteredStatsReflections.length === 0}
            className="shadow-sm bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg flex items-center gap-1.5 h-9"
          >
            Xuất Excel
          </Button>
          <RangePicker
            format={"DD/MM/YYYY"}
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates ? [dates[0], dates[1]] : null)
            }
            placeholder={["Từ ngày", "Đến ngày"]}
            style={{ width: 350 }}
            className="shadow-sm rounded-lg h-9"
            allowClear
          />
        </div>
      </div>

      {isStatsLoading ? (
        <div className="flex justify-center py-24">
          <Spin size="large" tip="Đang tải dữ liệu báo cáo..." />
        </div>
      ) : filteredStatsReflections.length === 0 ? (
        <Card className="shadow-sm rounded-2xl border border-slate-100 bg-white">
          <Empty description="Không có dữ liệu phản ánh trong khoảng thời gian được chọn" />
        </Card>
      ) : (
        <div className="space-y-6">
          <OverviewStats
            filteredStatsReflections={filteredStatsReflections}
            statsData={statsData}
          />
          <DetailedStats
            categoryData={categoryData}
            priorityData={priorityData}
            eventTypeData={eventTypeData}
          />
          <ActivityStats
            visitView={visitView}
            setVisitView={setVisitView}
            dashboardStats={dashboardStats}
          />
        </div>
      )}
    </div>
  );
}
