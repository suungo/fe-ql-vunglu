import { Card, Col, Row, Statistic, Tabs } from "antd";
import { motion } from "framer-motion";
import { CloudRain, Droplets, Wind } from "lucide-react";
import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Dữ liệu mẫu
const currentData = [
  { time: "00:00", mm: 12 },
  { time: "01:00", mm: 15 },
  { time: "02:00", mm: 20 },
  { time: "03:00", mm: 18 },
  { time: "04:00", mm: 25 },
  { time: "05:00", mm: 30 },
  { time: "06:00", mm: 45 },
];

const forecastData = [
  { time: "07:00", rain: 40, prob: 80 },
  { time: "08:00", rain: 35, prob: 70 },
  { time: "09:00", rain: 20, prob: 40 },
  { time: "10:00", rain: 10, prob: 20 },
  { time: "11:00", rain: 5, prob: 10 },
  { time: "12:00", rain: 0, prob: 0 },
  { time: "13:00", rain: 0, prob: 0 },
  { time: "14:00", rain: 15, prob: 30 },
];

const historyData = [
  { day: "T2", mm: 50 },
  { day: "T3", mm: 30 },
  { day: "T4", mm: 80 },
  { day: "T5", mm: 45 },
  { day: "T6", mm: 60 },
  { day: "T7", mm: 20 },
  { day: "CN", mm: 10 },
];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const CurrentView = () => (
  <div className="space-y-6">
    <Row gutter={16}>
      <Col span={8}>
        <Card bordered={false} className="bg-blue-50">
          <Statistic
            title="Lượng mưa hiện tại"
            value={45}
            suffix="mm"
            prefix={<CloudRain size={20} className="text-blue-500 mr-2" />}
            valueStyle={{ color: "#3b82f6", fontWeight: "bold" }}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card bordered={false} className="bg-cyan-50">
          <Statistic
            title="Độ ẩm"
            value={82}
            suffix="%"
            prefix={<Droplets size={20} className="text-cyan-500 mr-2" />}
            valueStyle={{ color: "#06b6d4", fontWeight: "bold" }}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card bordered={false} className="bg-slate-50">
          <Statistic
            title="Tốc độ gió"
            value={15}
            suffix="km/h"
            prefix={<Wind size={20} className="text-slate-500 mr-2" />}
            valueStyle={{ color: "#64748b", fontWeight: "bold" }}
          />
        </Card>
      </Col>
    </Row>

    <div className="h-[300px] w-full">
      <h4 className="text-slate-600 font-semibold mb-4">
        Biểu đồ lượng mưa theo giờ (Thực đo)
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={currentData}>
          <defs>
            <linearGradient id="colorMm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="mm"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorMm)"
            name="Lượng mưa (mm)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ForecastView = () => (
  <div className="space-y-4">
    <div className="h-[350px] w-full">
      <h4 className="text-slate-600 font-semibold mb-4">
        Dự báo lượng mưa 24h tới
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={forecastData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" />
          <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#82ca9d"
            unit="%"
          />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rain"
            stroke="#3b82f6"
            activeDot={{ r: 8 }}
            name="Lượng mưa (mm)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="prob"
            stroke="#82ca9d"
            name="Xác suất mưa (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const HistoryView = () => (
  <div className="space-y-4">
    <div className="h-[350px] w-full">
      <h4 className="text-slate-600 font-semibold mb-4">
        Tổng lượng mưa 7 ngày qua
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={historyData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="mm"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="Lượng mưa (mm)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const RainInfo: React.FC = () => {
  const items = [
    { key: "1", label: "Hiện tại", children: <CurrentView /> },
    { key: "2", label: "Dự báo", children: <ForecastView /> },
    { key: "3", label: "Lịch sử", children: <HistoryView /> },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-2"
    >
      <Tabs defaultActiveKey="1" items={items} type="card" />
    </motion.div>
  );
};

export default RainInfo;
