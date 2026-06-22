import {
  Button,
  Form,
  Table,
  Tag,
  Empty,
  Input,
  Tooltip,
  Progress,
  Avatar,
  Tabs,
  Rate,
} from "antd";
import type { ColumnType } from "antd/es/table";
import { Pencil, Search, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

import { useReputationData } from "../hook/useReputationData";
import {
  getReputationLevel,
  getInitials,
  AVATAR_COLORS,
} from "../utils/reputationHelpers";
import type { UserReputation } from "../hook/useReputationData";
import ReputationStats from "../components/ReputationStats";
import ReputationModal from "../components/ReputationModal";
import { getStaffWorkQuality } from "../api/reputationApi";

export default function ListReputations() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>("reputation");

  // States for Quality of Work
  const [qualityData, setQualityData] = useState<any[]>([]);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityPage, setQualityPage] = useState(1);
  const [qualityLimit, setQualityLimit] = useState(10);
  const [qualityTotal, setQualityTotal] = useState(0);

  const {
    users,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    total,
    keyword,
    setKeyword,
    isModalOpen,
    setIsModalOpen,
    selectedUser,
    setSelectedUser,
    isSubmitting,
    handleUpdate,
    fetchUsers,
  } = useReputationData(form);

  const fetchQuality = async () => {
    setQualityLoading(true);
    try {
      const res = await getStaffWorkQuality(qualityPage, qualityLimit, keyword);
      if (res.data?.statusCode === 200) {
        setQualityData(res.data?.data || []);
        setQualityTotal(res.data?.meta?.total || 0);
      }
    } catch (err) {
      console.error("Lỗi khi tải chất lượng công việc:", err);
    } finally {
      setQualityLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "quality") {
      const handler = setTimeout(() => fetchQuality(), 300);
      return () => clearTimeout(handler);
    }
  }, [activeTab, qualityPage, qualityLimit, keyword]);

  const handleRefresh = () => {
    if (activeTab === "reputation") {
      fetchUsers();
    } else {
      fetchQuality();
    }
  };

  const columns: ColumnType<UserReputation>[] = [
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => {
        const avatarColor = AVATAR_COLORS[record.id % AVATAR_COLORS.length];
        return (
          <div className="flex items-center gap-3">
            <Avatar
              size={40}
              style={{ backgroundColor: avatarColor, flexShrink: 0 }}
              className="font-bold text-sm"
            >
              {getInitials(record.fullName)}
            </Avatar>
            <div>
              <div className="font-semibold text-slate-800 text-sm leading-tight">
                {record.fullName || "Người dùng ẩn danh"}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {record.email || record.phoneNumber}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 140,
      render: (phone) => (
        <span className="font-mono text-sm text-slate-600">{phone}</span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: ["role", "roleName"],
      key: "roleName",
      width: 140,
      render: (roleName) => (
        <Tag
          className="rounded-full px-3 py-0.5 text-xs font-medium border-0"
          style={{ background: "#ede9fe", color: "#7c3aed" }}
        >
          {roleName || "Cư dân"}
        </Tag>
      ),
    },
    {
      title: "Điểm uy tín",
      dataIndex: "reputationPoints",
      key: "reputationPoints",
      width: 220,
      sorter: (a, b) => a.reputationPoints - b.reputationPoints,
      render: (points) => {
        const pts = points ?? 10;
        const level = getReputationLevel(pts);
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${level.bg} ${level.text} ${level.border}`}
              >
                {level.label}
              </span>
              <span className="text-sm font-bold text-slate-700">
                {pts}
                <span className="text-slate-400 font-normal">/10</span>
              </span>
            </div>
            <Progress
              percent={(pts / 10) * 100}
              showInfo={false}
              strokeColor={level.color}
              trailColor="#f1f5f9"
              size="small"
              className="m-0!"
            />
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Tooltip title="Điều chỉnh điểm uy tín">
          <Button
            type="text"
            size="small"
            icon={<Pencil size={15} />}
            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={() => {
              setSelectedUser(record);
              form.setFieldsValue({
                reputationPoints: record.reputationPoints ?? 10,
              });
              setIsModalOpen(true);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  const qualityColumns: ColumnType<any>[] = [
    {
      title: "Nhân sự",
      key: "user",
      render: (_, record) => {
        const avatarColor = AVATAR_COLORS[record.id % AVATAR_COLORS.length];
        return (
          <div className="flex items-center gap-3">
            <Avatar
              size={40}
              style={{ backgroundColor: avatarColor, flexShrink: 0 }}
              className="font-bold text-sm"
            >
              {getInitials(record.fullName)}
            </Avatar>
            <div>
              <div className="font-semibold text-slate-800 text-sm leading-tight">
                {record.fullName || "Nhân sự ẩn danh"}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {record.email || record.phoneNumber}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 140,
      render: (phone) => (
        <span className="font-mono text-sm text-slate-600">{phone}</span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: ["role", "description"],
      key: "description",
      width: 140,
      render: (description) => (
        <Tag
          className="rounded-full px-3 py-0.5 text-xs font-medium border-0"
          style={{ background: "#f0fdf4", color: "#16a34a" }}
        >
          {description || "Nhân sự"}
        </Tag>
      ),
    },
    {
      title: "Chất lượng công việc",
      key: "averageRating",
      width: 260,
      render: (_, record) => {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Rate
                disabled
                allowHalf
                value={record.averageRating || 0}
                className="text-amber-400 text-sm!"
              />
              <span className="text-sm font-bold text-slate-700 ml-1">
                {record.averageRating || 0}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {record.role?.roleCode === "OFFICER"
                ? `(${record.ratingCount || 0} lượt xác minh)`
                : `(${record.ratingCount || 0} lượt đánh giá)`}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 bg-[#FFFFFF] rounded-lg shadow-md min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="2xl:text-[22px] xl:text-[20px] text-[18px] font-bold text-slate-800 m-0">
            Quản lý uy tín & Chất lượng công việc
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Input
            prefix={<Search size={14} className="text-slate-400" />}
            className="w-60 rounded-lg"
            placeholder="Tìm kiếm tên, số điện thoại..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
              setQualityPage(1);
            }}
            allowClear
          />
          <Tooltip title="Làm mới">
            <Button
              icon={<RefreshCw size={14} />}
              onClick={handleRefresh}
              className="rounded-lg"
            />
          </Tooltip>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          setKeyword("");
          setPage(1);
          setQualityPage(1);
        }}
        items={[
          {
            key: "reputation",
            label: (
              <span className="font-medium text-[16px] px-2">
                Danh sách điểm uy tín (Cư dân)
              </span>
            ),
            children: (
              <div className="space-y-4">
                <ReputationStats users={users} total={total} />
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <Table
                    loading={loading}
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    rowClassName="hover:bg-slate-50/70 transition-colors"
                    pagination={{
                      current: page,
                      pageSize: limit,
                      total: total,
                      showSizeChanger: true,
                      showTotal: (t) => (
                        <span className="text-slate-500 text-sm">
                          Tổng <b>{t}</b> người dùng
                        </span>
                      ),
                      onChange: (p, s) => {
                        setPage(p);
                        setLimit(s);
                      },
                      className: "px-6 py-3",
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-slate-400">
                              Không tìm thấy cư dân nào
                            </span>
                          }
                        />
                      ),
                    }}
                    className="[&_.ant-table-thead_.ant-table-cell]:bg-slate-50 [&_.ant-table-thead_.ant-table-cell]:text-slate-500 [&_.ant-table-thead_.ant-table-cell]:font-semibold [&_.ant-table-thead_.ant-table-cell]:text-xs [&_.ant-table-thead_.ant-table-cell]:uppercase [&_.ant-table-thead_.ant-table-cell]:tracking-wide"
                  />
                </div>
              </div>
            ),
          },
          {
            key: "quality",
            label: (
              <span className="font-medium text-[16px] px-2">
                Chất lượng công việc (Nhân sự)
              </span>
            ),
            children: (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <Table
                  loading={qualityLoading}
                  dataSource={qualityData}
                  columns={qualityColumns}
                  rowKey="id"
                  rowClassName="hover:bg-slate-50/70 transition-colors"
                  pagination={{
                    current: qualityPage,
                    pageSize: qualityLimit,
                    total: qualityTotal,
                    showSizeChanger: true,
                    showTotal: (t) => (
                      <span className="text-slate-500 text-sm">
                        Tổng <b>{t}</b> nhân sự
                      </span>
                    ),
                    onChange: (p, s) => {
                      setQualityPage(p);
                      setQualityLimit(s);
                    },
                    className: "px-6 py-3",
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className="text-slate-400">
                            Không tìm thấy nhân sự nào
                          </span>
                        }
                      />
                    ),
                  }}
                  className="[&_.ant-table-thead_.ant-table-cell]:bg-slate-50 [&_.ant-table-thead_.ant-table-cell]:text-slate-500 [&_.ant-table-thead_.ant-table-cell]:font-semibold [&_.ant-table-thead_.ant-table-cell]:text-xs [&_.ant-table-thead_.ant-table-cell]:uppercase [&_.ant-table-thead_.ant-table-cell]:tracking-wide"
                />
              </div>
            ),
          },
        ]}
      />

      <ReputationModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        form={form}
        isSubmitting={isSubmitting}
        handleUpdate={handleUpdate}
      />
    </div>
  );
}
