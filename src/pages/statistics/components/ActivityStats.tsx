import React from "react";
import { Card, Segmented } from "antd";
import { Activity, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ActivityStatsProps {
  visitView: "day" | "month" | "year";
  setVisitView: (view: "day" | "month" | "year") => void;
  dashboardStats: any;
}

export default function ActivityStats({
  visitView,
  setVisitView,
  dashboardStats,
}: ActivityStatsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card
        title={
          <div className="flex items-center justify-between gap-2 text-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              <span>Thống kê lượt truy cập</span>
            </div>
            <Segmented
              options={[
                { label: "Ngày", value: "day" },
                { label: "Tháng", value: "month" },
                { label: "Năm", value: "year" },
              ]}
              value={visitView}
              onChange={(val) => setVisitView(val as any)}
            />
          </div>
        }
        className="lg:col-span-2 shadow-sm rounded-2xl border border-slate-100 bg-white"
      >
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dashboardStats.visits[visitView]}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(value) =>
                  value >= 1000 ? `${value / 1000}k` : value
                }
              />
              <RechartsTooltip
                cursor={{
                  stroke: "rgba(0, 0, 0, 0.1)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                }}
                formatter={(value: any) => [
                  `${value?.toLocaleString() || 0} lượt`,
                  "Lượt truy cập",
                ]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <Users className="text-emerald-500" size={20} />
            <span>Trạng thái tài khoản</span>
          </div>
        }
        className="shadow-sm rounded-2xl border border-slate-100 bg-white"
      >
        <div className="flex flex-col items-center relative">
          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardStats.activeAccounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {dashboardStats.activeAccounts.map(
                    (entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ),
                  )}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Trung tâm biểu đồ Doughnut */}
          <div className="absolute top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] flex flex-col items-center pointer-events-none">
            <span className="text-3xl font-black text-slate-800">
              {dashboardStats.activeAccounts[0]?.value || 0}
            </span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
              Online
            </span>
          </div>

          {/* Chú thích */}
          <div className="flex justify-center gap-6 mt-4 w-full">
            {dashboardStats.activeAccounts.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-600 font-medium">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
