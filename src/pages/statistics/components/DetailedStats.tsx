import React from "react";
import { Card } from "antd";
import { TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent <= 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[11px] font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface DetailedStatsProps {
  categoryData: any[];
  priorityData: any[];
  eventTypeData: any[];
}

export default function DetailedStats({
  categoryData,
  priorityData,
  eventTypeData,
}: DetailedStatsProps) {
  return (
    <Card
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <TrendingUp className="text-emerald-500" size={20} />
          <span>Thống kê chi tiết theo Danh mục, Mức độ & Loại sự cố</span>
        </div>
      }
      className="shadow-sm mb-4! rounded-2xl border border-slate-100 bg-white"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Pie Chart */}
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">
              Phân theo Danh mục
            </h4>
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={75}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      fontSize: "11px",
                      paddingTop: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Pie Chart */}
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">
              Phân theo Mức độ
            </h4>
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={75}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      fontSize: "11px",
                      paddingTop: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Horizontal Bar Chart for Event Types */}
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-slate-600 mb-2 text-center lg:text-left">
            Phân theo Loại sự cố
          </h4>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={eventTypeData}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={true}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  width={90}
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
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                >
                  {eventTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
