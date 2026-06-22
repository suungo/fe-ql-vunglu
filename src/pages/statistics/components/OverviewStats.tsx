import React from "react";
import { Card, Statistic } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ReflectionStatus } from "@/pages/reflection/enum";

interface OverviewStatsProps {
  filteredStatsReflections: any[];
  statsData: any[];
}

export default function OverviewStats({
  filteredStatsReflections,
  statsData,
}: OverviewStatsProps) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleCode = user?.role?.roleCode;
  const isManager = roleCode === "MANAGER";
  const isAdmin = roleCode === "ADMIN";

  const totalCount = React.useMemo(() => {
    if (isManager || isAdmin) {
      return filteredStatsReflections.filter(
        (r) => r.status !== ReflectionStatus.PENDING,
      ).length;
    }
    return filteredStatsReflections.length;
  }, [filteredStatsReflections, isManager, isAdmin]);

  return (
    <Card className="shadow-sm rounded-2xl mb-4! border border-slate-100 bg-white">
      <div className="space-y-6">
        {/* Statistics Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:${isManager ? 'grid-cols-4' : 'grid-cols-5'} gap-4 mb-4`}>
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
            <Statistic
              title="Tổng phản ánh"
              value={totalCount}
              valueStyle={{ color: "#2563eb", fontWeight: "bold" }}
            />
          </div>
          {!isManager && (
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
              <Statistic
                title="Chờ xác minh"
                value={
                  filteredStatsReflections.filter(
                    (r) => r.status === ReflectionStatus.PENDING,
                  ).length
                }
                valueStyle={{ color: "#d97706", fontWeight: "bold" }}
              />
            </div>
          )}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/50">
            <Statistic
              title="Đang xử lý"
              value={
                filteredStatsReflections.filter(
                  (r) => r.status === ReflectionStatus.IN_PROGRESS,
                ).length
              }
              valueStyle={{ color: "#0284c7", fontWeight: "bold" }}
            />
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
            <Statistic
              title="Đã hoàn thành"
              value={
                filteredStatsReflections.filter(
                  (r) => r.status === ReflectionStatus.RESOLVED,
                ).length
              }
              valueStyle={{ color: "#059669", fontWeight: "bold" }}
            />
          </div>
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50">
            <Statistic
              title="Từ chối"
              value={
                filteredStatsReflections.filter(
                  (r) => r.status === ReflectionStatus.REJECTED,
                ).length
              }
              valueStyle={{ color: "#ef4444", fontWeight: "bold" }}
            />
          </div>
        </div>

        {/* Column Bar Chart */}
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statsData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <RechartsTooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                }}
              />
              <Bar
                dataKey="count"
                name="Số lượng"
                radius={[6, 6, 0, 0]}
                barSize={36}
              >
                {statsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
