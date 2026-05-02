import { Card, Col, Row, Statistic, Tabs, Tag } from "antd";
import { motion, type Variants } from "framer-motion";
import { AlertTriangle, Car, Clock, MapPin } from "lucide-react";
import React from "react";

// Dữ liệu mẫu về các tuyến đường ngập
const floodedRoutes = [
  {
    id: 1,
    name: "Đường Nguyễn Hữu Cảnh",
    district: "Quận Bình Thạnh",
    depth: 45,
    status: "congestion", // normal, slow, congestion
    statusText: "Kẹt xe nghiêm trọng",
    updatedAt: "5 phút trước",
  },
  {
    id: 2,
    name: "Đường Thảo Điền",
    district: "Thành phố Thủ Đức",
    depth: 30,
    status: "slow",
    statusText: "Di chuyển chậm",
    updatedAt: "10 phút trước",
  },
  {
    id: 3,
    name: "Đường Huỳnh Tấn Phát",
    district: "Quận 7",
    depth: 25,
    status: "slow",
    statusText: "Di chuyển chậm",
    updatedAt: "15 phút trước",
  },
  {
    id: 4,
    name: "Đường Trần Xuân Soạn",
    district: "Quận 7",
    depth: 50,
    status: "congestion",
    statusText: "Ngập sâu - Cấm xe",
    updatedAt: "2 phút trước",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "congestion")
    return (
      <Tag color="error" icon={<AlertTriangle size={12} />}>
        Kẹt xe
      </Tag>
    );
  if (status === "slow")
    return (
      <Tag color="warning" icon={<Clock size={12} />}>
        Chậm
      </Tag>
    );
  return <Tag color="success">Thông thoáng</Tag>;
};

const RoutesView = () => (
  <div className="space-y-4">
    <Row gutter={16} className="mb-4">
      <Col span={8}>
        <Card bordered={false} className="bg-red-50">
          <Statistic
            title="Điểm ngập sâu"
            value={floodedRoutes.filter((r) => r.depth >= 40).length}
            prefix={<AlertTriangle size={20} className="text-red-500 mr-2" />}
            valueStyle={{ color: "#ef4444", fontWeight: "bold" }}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card bordered={false} className="bg-orange-50">
          <Statistic
            title="Điểm kẹt xe"
            value={
              floodedRoutes.filter((r) => r.status === "congestion").length
            }
            prefix={<Car size={20} className="text-orange-500 mr-2" />}
            valueStyle={{ color: "#f97316", fontWeight: "bold" }}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card bordered={false} className="bg-blue-50">
          <Statistic
            title="Tổng số điểm theo dõi"
            value={12}
            prefix={<MapPin size={20} className="text-blue-500 mr-2" />}
            valueStyle={{ color: "#3b82f6", fontWeight: "bold" }}
          />
        </Card>
      </Col>
    </Row>

    <h4 className="text-slate-600 font-semibold">
      Danh sách các tuyến đường ảnh hưởng
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {floodedRoutes.map((route) => (
        <Card
          key={route.id}
          size="small"
          className="shadow-sm hover:shadow-md transition-shadow border-slate-200"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h5 className="font-bold text-slate-800 text-base">
                {route.name}
              </h5>
              <p className="text-slate-500 text-xs">{route.district}</p>
            </div>
            <StatusBadge status={route.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 my-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Độ sâu:{" "}
              <span className="font-semibold text-blue-600">
                {route.depth}cm
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} /> {route.updatedAt}
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const TrafficInfo: React.FC = () => {
  const items = [
    { key: "1", label: "Tuyến đường ngập", children: <RoutesView /> },
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

export default TrafficInfo;
