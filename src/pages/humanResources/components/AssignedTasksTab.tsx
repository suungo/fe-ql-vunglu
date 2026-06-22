import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Row, Col, Statistic, Table, Tag, Button, Empty, Spin } from "antd";
import type { ColumnType } from "antd/es/table";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Eye, MapPin, Calendar, CheckCircle, Clock, PlayCircle, Ban } from "lucide-react";
import { getReflectionsApi, getAssignedStatsApi } from "@/pages/reflection/api";
import { Priority, ReflectionStatus } from "@/pages/reflection/enum";
import type { Reflection } from "@/pages/reflection/interfaces";

interface AssignedTasksTabProps {
  userId?: number;
}

export default function AssignedTasksTab({ userId }: AssignedTasksTabProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // 1. Fetch Stats Yêu cầu
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["assigned-stats", userId],
    queryFn: () => getAssignedStatsApi(userId!),
    enabled: !!userId,
  });
  const stats = statsRes?.data;

  // 2. Fetch Danh sách nhiệm vụ
  const { data: reflectionsRes, isLoading: listLoading } = useQuery({
    queryKey: ["assigned-reflections", userId, page, limit],
    queryFn: () =>
      getReflectionsApi({
        page,
        limit,
        assignedUserId: userId,
      }),
    enabled: !!userId,
  });
  const reflections = reflectionsRes?.data || [];
  const totalItems = reflectionsRes?.meta?.total || 0;

  if (!userId) {
    return (
      <Card bordered={false} className="shadow-sm rounded-xl py-8 text-center">
        <Empty
          description={
            <div className="space-y-1">
              <p className="text-gray-500 font-medium text-base">Nhân sự chưa có tài khoản hệ thống</p>
              <p className="text-gray-400 text-sm">Chỉ những nhân sự đã liên kết với tài khoản người dùng mới có thể thống kê nhiệm vụ.</p>
            </div>
          }
        />
      </Card>
    );
  }

  if (statsLoading || listLoading) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu nhiệm vụ..." />
      </div>
    );
  }

  // Cấu hình màu sắc trạng thái
  const COLORS = {
    completed: "#10b981", // Xanh lá
    inProgress: "#3b82f6", // Xanh dương
    pending: "#f59e0b", // Cam
    rejected: "#ef4444", // Đỏ
  };

  // Chuẩn bị dữ liệu cho biểu đồ tròn
  const chartData = [
    { name: "Đã hoàn thành", value: stats?.completed || 0, color: COLORS.completed },
    { name: "Đang xử lý", value: stats?.inProgress || 0, color: COLORS.inProgress },
    { name: "Chờ xử lý / xác minh", value: stats?.pending || 0, color: COLORS.pending },
    { name: "Từ chối", value: stats?.rejected || 0, color: COLORS.rejected },
  ].filter(item => item.value > 0);

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

  const getStatusTag = (status?: ReflectionStatus) => {
    const cfg: Record<string, { color: string; label: string }> = {
      PENDING:     { color: "orange",   label: "Chờ xác minh" },
      VERIFIED:    { color: "blue",     label: "Đã xác minh" },
      ASSIGNED:    { color: "purple",   label: "Đã phân công" },
      IN_PROGRESS: { color: "geekblue", label: "Đang xử lý" },
      COMPLETED:   { color: "cyan",     label: "Chờ xác nhận" },
      RESOLVED:    { color: "green",    label: "Đã hoàn thành" },
      REJECTED:    { color: "red",      label: "Từ chối" },
    };
    const c = cfg[status ?? ""] ?? { color: "default", label: "Mới" };
    return <Tag color={c.color}>{c.label}</Tag>;
  };

  const columns: ColumnType<Reflection>[] = [
    {
      title: "Mã",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (val: number) => <span className="text-gray-400 text-xs">#{val}</span>,
    },
    {
      title: "Tiêu đề / Nội dung",
      key: "title",
      width: 250,
      render: (_, record: Reflection) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 line-clamp-1">{record.title || "Không có tiêu đề"}</span>
          <span className="text-xs text-slate-500 line-clamp-1">{record.content}</span>
        </div>
      ),
    },
    {
      title: "Vị trí",
      key: "location",
      width: 220,
      render: (_, record: Reflection) => (
        <span className="text-xs text-slate-600 flex items-center gap-1">
          <MapPin size={12} className="shrink-0 text-slate-400" />
          <span className="line-clamp-2">{record.address || `${record.lat}, ${record.lng}`}</span>
        </span>
      ),
    },
    {
      title: "Mức độ",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (val: Priority) => getPriorityTag(val),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (val: ReflectionStatus) => getStatusTag(val),
    },
    {
      title: "Ngày giao",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date: string) => (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar size={12} className="text-slate-400" />
          {dayjs(date).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record: Reflection) => (
        <Button
          size="small"
          icon={<Eye size={14} />}
          onClick={() => navigate(`/app/reflection-manager/detail/${record.id}`)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Thống kê dạng thẻ */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={4.8} className="w-full md:w-[20%]">
          <Card bordered={false} className="shadow-sm border border-slate-100 bg-[#f8fafc] rounded-xl">
            <Statistic
              title={<span className="text-slate-500 text-sm font-medium">Tổng nhiệm vụ</span>}
              value={stats?.total || 0}
              valueStyle={{ color: "#475569", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8} className="w-full md:w-[20%]">
          <Card bordered={false} className="shadow-sm border border-emerald-100 bg-emerald-50/20 rounded-xl">
            <Statistic
              title={
                <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                  <CheckCircle size={14} /> Đã hoàn thành
                </span>
              }
              value={stats?.completed || 0}
              valueStyle={{ color: COLORS.completed, fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8} className="w-full md:w-[20%]">
          <Card bordered={false} className="shadow-sm border border-blue-100 bg-blue-50/20 rounded-xl">
            <Statistic
              title={
                <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                  <PlayCircle size={14} /> Đang xử lý
                </span>
              }
              value={stats?.inProgress || 0}
              valueStyle={{ color: COLORS.inProgress, fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8} className="w-full md:w-[20%]">
          <Card bordered={false} className="shadow-sm border border-amber-100 bg-amber-50/20 rounded-xl">
            <Statistic
              title={
                <span className="text-amber-600 text-sm font-medium flex items-center gap-1">
                  <Clock size={14} /> Chờ xử lý
                </span>
              }
              value={stats?.pending || 0}
              valueStyle={{ color: COLORS.pending, fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8} className="w-full md:w-[20%]">
          <Card bordered={false} className="shadow-sm border border-rose-100 bg-rose-50/20 rounded-xl">
            <Statistic
              title={
                <span className="text-rose-600 text-sm font-medium flex items-center gap-1">
                  <Ban size={14} /> Từ chối
                </span>
              }
              value={stats?.rejected || 0}
              valueStyle={{ color: COLORS.rejected, fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Biểu đồ thống kê và Danh sách nhiệm vụ */}
      <Row gutter={[20, 20]}>
        {/* Cột trái: Biểu đồ Donut */}
        <Col xs={24} lg={8}>
          <Card title="Phân bố trạng thái nhiệm vụ" className="shadow-sm border border-slate-100 rounded-xl h-full min-h-[350px]">
            {chartData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center">
                <Empty description="Không có dữ liệu biểu đồ" />
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [`${value} nhiệm vụ`, "Số lượng"]}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Cột phải: Bảng danh sách nhiệm vụ */}
        <Col xs={24} lg={16}>
          <Card title="Danh sách nhiệm vụ được giao" className="shadow-sm border border-slate-100 rounded-xl overflow-hidden">
            <Table
              dataSource={reflections}
              columns={columns}
              rowKey="id"
              size="middle"
              pagination={{
                current: page,
                pageSize: limit,
                total: totalItems,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20"],
                onChange: (p, s) => {
                  setPage(p);
                  setLimit(s);
                },
              }}
              locale={{
                emptyText: <Empty description="Chưa được giao nhiệm vụ nào" />,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
