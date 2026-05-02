import { Card, Col, Row, Statistic, Tabs, Tag } from "antd";
import { motion, type Variants } from "framer-motion";
import { ArrowUp, Clock, Waves } from "lucide-react";
import React from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// Dữ liệu mẫu triều cường (mô phỏng hình sin của thủy triều)
const currentData = [
  { time: "00:00", level: 1.2 },
  { time: "02:00", level: 1.4 },
  { time: "04:00", level: 1.6 },
  { time: "06:00", level: 1.5 },
  { time: "08:00", level: 1.1 },
  { time: "10:00", level: 0.8 },
  { time: "12:00", level: 0.6 },
  { time: "14:00", level: 0.9 },
  { time: "16:00", level: 1.3 },
];

const forecastData = [
  { time: "18:00", level: 1.5 },
  { time: "20:00", level: 1.65 }, // Đỉnh triều
  { time: "22:00", level: 1.5 },
  { time: "00:00", level: 1.2 },
  { time: "02:00", level: 0.9 },
  { time: "04:00", level: 0.7 },
  { time: "06:00", level: 1.0 },
  { time: "08:00", level: 1.4 },
];

const historyData = [
  { day: "T2", maxLevel: 1.55 },
  { day: "T3", maxLevel: 1.6 },
  { day: "T4", maxLevel: 1.65 },
  { day: "T5", maxLevel: 1.7 }, // Đỉnh cao nhất
  { day: "T6", maxLevel: 1.62 },
  { day: "T7", maxLevel: 1.58 },
  { day: "CN", maxLevel: 1.5 },
];

const containerVariants: Variants = {
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
        <Card bordered={false} className="bg-cyan-50">
          <Statistic
            title="Mực nước hiện tại"
            value={1.35}
            precision={2}
            suffix="m"
            prefix={<Waves size={20} className="text-cyan-600 mr-2" />}
            valueStyle={{ color: "#0891b2", fontWeight: "bold" }}
          />
          <div className="mt-2 flex items-center text-cyan-700 text-sm">
            <ArrowUp size={14} className="mr-1" /> Đang lên
          </div>
        </Card>
      </Col>
      <Col span={8}>
        <Card bordered={false} className="bg-blue-50">
          <Statistic
            title="Đỉnh triều tiếp theo"
            value="1.65"
            suffix="m"
            prefix={<ArrowUp size={20} className="text-blue-500 mr-2" />}
            valueStyle={{ color: "#2563eb", fontWeight: "bold" }}
          />
          <div className="mt-2 flex items-center text-blue-700 text-sm">
            <Clock size={14} className="mr-1" /> Dự kiến lúc 20:00
          </div>
        </Card>
      </Col>
      <Col span={8}>
        <Card bordered={false} className="bg-slate-50">
          <Statistic
            title="Cảnh báo"
            value="Mức 2"
            prefix={
              <Tag color="warning" className="mr-2">
                Báo động
              </Tag>
            }
            valueStyle={{
              color: "#d97706",
              fontWeight: "bold",
              fontSize: "1.25rem",
            }}
          />
          <div className="mt-2 text-slate-500 text-sm">
            Nguy cơ ngập vùng trũng thấp
          </div>
        </Card>
      </Col>
    </Row>

    <div className="h-[300px] w-full">
      <h4 className="text-slate-600 font-semibold mb-4">
        Biểu đồ mực nước theo giờ (Thực đo)
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={currentData}>
          <defs>
            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0891b2" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 2]} />
          <Tooltip />
          <ReferenceLine
            y={1.5}
            label="Báo động I"
            stroke="orange"
            strokeDasharray="3 3"
          />
          <ReferenceLine
            y={1.6}
            label="Báo động II"
            stroke="red"
            strokeDasharray="3 3"
          />
          <Area
            type="monotone"
            dataKey="level"
            stroke="#0891b2"
            fillOpacity={1}
            fill="url(#colorLevel)"
            name="Mực nước (m)"
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
        Dự báo mực nước 24h tới
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={forecastData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 2]} />
          <Tooltip />
          <Legend />
          <ReferenceLine y={1.6} label="Mức nguy hiểm" stroke="red" />
          <Line
            type="monotone"
            dataKey="level"
            stroke="#0891b2"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            name="Dự báo mực nước (m)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 text-sm">
      <strong>Lưu ý:</strong> Đỉnh triều cao nhất dự kiến đạt 1.65m vào lúc
      20:00 tối nay. Các khu vực trũng thấp ven sông cần đề phòng ngập úng.
    </div>
  </div>
);

const HistoryView = () => (
  <div className="space-y-4">
    <div className="h-[350px] w-full">
      <h4 className="text-slate-600 font-semibold mb-4">
        Đỉnh triều cao nhất 7 ngày qua
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={historyData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" />
          <YAxis domain={[1.0, 2.0]} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="maxLevel"
            fill="#0891b2"
            radius={[4, 4, 0, 0]}
            name="Đỉnh triều (m)"
          >
            {historyData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.maxLevel >= 1.6 ? "#ef4444" : "#0891b2"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const TideInfo: React.FC = () => {
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

export default TideInfo;
