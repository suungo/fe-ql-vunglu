import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  notification,
  Empty,
  Tooltip,
  Avatar,
  Badge,
} from "antd";
import type { ColumnType } from "antd/es/table";
import dayjs from "dayjs";
import {
  Bell,
  Send,
  RefreshCw,
  MessageSquare,
  Users,
  CheckCheck,
  Clock,
  PlusCircle,
  Megaphone,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BASE_URL } from "@/apis";

const { TextArea } = Input;

interface SystemNotification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  type?: string;
  createdAt: string;
  user?: {
    fullName: string;
    phoneNumber: string;
    role?: {
      roleName: string;
    };
  };
}

interface UserOption {
  id: number;
  fullName: string;
  phoneNumber: string;
  role?: {
    roleCode: string;
    roleName: string;
  };
}

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

const getInitials = (name: string) =>
  name
    ?.split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

export default function ListNotifications() {
  const [notificationsData, setNotificationsData] = useState<
    SystemNotification[]
  >([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [recipientType, setRecipientType] = useState<
    "all" | "role" | "individual"
  >("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await BASE_URL.get("/notifications/admin-list", {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (res.data?.statusCode === 200) {
        setNotificationsData(res.data?.data || []);
        setTotal(res.data?.meta?.total || 0);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách thông báo:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await BASE_URL.get("/users", {
        params: { limit: 1000 },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (res.data?.statusCode === 200) {
        setUsers(res.data?.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  useEffect(() => {
    if (isModalOpen) fetchUsers();
  }, [isModalOpen]);

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const payload: any = {
        title: values.title,
        content: values.content,
      };
      if (recipientType === "individual") payload.userId = values.userId;
      else if (recipientType === "role") payload.roleCode = values.roleCode;

      const res = await BASE_URL.post("/notifications", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (res.data?.statusCode === 201 || res.status === 201) {
        notification.success({
          message: "Gửi thành công",
          description: res.data?.message || "Thông báo đã được gửi đi!",
        });
        setIsModalOpen(false);
        form.resetFields();
        setRecipientType("all");
        fetchNotifications();
      }
    } catch (err: any) {
      notification.error({
        message: "Gửi thất bại",
        description:
          err?.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRead = notificationsData.filter((n) => n.isRead).length;
  const totalUnread = notificationsData.filter((n) => !n.isRead).length;

  const statCards = [
    {
      label: "Tổng thông báo",
      value: total,
      icon: <Bell size={20} />,
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },
    {
      label: "Đã đọc",
      value: totalRead,
      icon: <CheckCheck size={20} />,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Chưa đọc",
      value: totalUnread,
      icon: <Clock size={20} />,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      label: "Người dùng",
      value: users.length || "–",
      icon: <Users size={20} />,
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
  ];

  const columns: ColumnType<SystemNotification>[] = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (val) => (
        <div>
          <div className="text-sm font-medium text-slate-700">
            {dayjs(val).format("HH:mm")}
          </div>
          <div className="text-xs text-slate-400">
            {dayjs(val).format("DD/MM/YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Người nhận",
      dataIndex: "user",
      key: "user",
      width: 210,
      render: (user, record) => {
        if (!user)
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Megaphone size={14} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700">
                  Tất cả người dùng
                </div>
                <div className="text-xs text-slate-400">Toàn hệ thống</div>
              </div>
            </div>
          );
        return (
          <div className="flex items-center gap-2">
            <Avatar
              size={32}
              style={{
                backgroundColor:
                  AVATAR_COLORS[record.id % AVATAR_COLORS.length],
                fontSize: 12,
              }}
              className="shrink-0 font-bold"
            >
              {getInitials(user.fullName)}
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-slate-700">
                {user.fullName}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {user.phoneNumber}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Vai trò",
      key: "roleName",
      width: 130,
      render: (_, record) => {
        const roleName = record.user?.role?.roleName;
        return roleName ? (
          <Tag
            className="rounded-full px-3 py-0.5 text-xs font-medium border-0"
            style={{ background: "#ede9fe", color: "#7c3aed" }}
          >
            {roleName}
          </Tag>
        ) : (
          <Tag
            className="rounded-full px-3 py-0.5 text-xs border-0"
            style={{ background: "#f1f5f9", color: "#64748b" }}
          >
            Hệ thống
          </Tag>
        );
      },
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (title, record) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm leading-tight">
            {title}
          </div>
          <div
            className="text-xs text-slate-400 mt-0.5 truncate max-w-xs"
            title={record.content}
          >
            {record.content}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isRead",
      key: "isRead",
      width: 150,
      align: "center",
      render: (isRead) =>
        isRead ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCheck size={12} /> Đã đọc
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <Clock size={12} /> Chưa đọc
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-5 p-4 bg-[#FFFFFF] rounded-lg shadow-sm min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="2xl:text-[22px] xl:text-[20px] text-[18px] font-bold text-slate-800 m-0">
          Quản lý thông báo hệ thống
        </h2>

        <div className="flex items-center gap-2">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg flex items-center gap-1.5 h-9! text-sm!"
          >
            Thêm thông báo
          </Button>
          <Tooltip title="Làm mới">
            <Button
              icon={<RefreshCw size={14} />}
              onClick={fetchNotifications}
              className="rounded-lg"
            />
          </Tooltip>
        </div>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center ${card.text} shrink-0`}
            >
              {card.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {card.value}
              </div>
              <div className="text-xs text-slate-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table */}
        <Table
          loading={loading}
          dataSource={notificationsData}
          columns={columns}
          rowKey="id"
          rowClassName="hover:bg-slate-50/70 transition-colors"
          pagination={{
            current: page,
            pageSize: limit,
            total: total,
            showTotal: (t) => (
              <span className="text-slate-500 text-sm">
                Tổng <b>{t}</b> thông báo
              </span>
            ),
            onChange: (p) => setPage(p),
            className: "px-6 py-3",
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-slate-400">
                    Chưa có thông báo nào được gửi
                  </span>
                }
              />
            ),
          }}
          className="[&_.ant-table-thead_.ant-table-cell]:bg-slate-50 [&_.ant-table-thead_.ant-table-cell]:text-slate-500 [&_.ant-table-thead_.ant-table-cell]:font-semibold [&_.ant-table-thead_.ant-table-cell]:text-xs [&_.ant-table-thead_.ant-table-cell]:uppercase [&_.ant-table-thead_.ant-table-cell]:tracking-wide"
        />
      </div>

      {/* MODAL GỬI THÔNG BÁO */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setRecipientType("all");
        }}
        footer={null}
        width={520}
        centered
      >
        <div className="pt-2">
          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <h3 className="2xl:text-[22px] xl:text-[20px] text-[18px] font-bold text-slate-800 m-0">
              Thêm thông báo mới
            </h3>
          </div>

          <Form form={form} layout="vertical">
            {/* Recipient Type */}
            <Form.Item
              label={
                <span className="text-sm font-medium text-slate-700">
                  Đối tượng <span className="text-red-500">*</span>
                </span>
              }
              required={false}
            >
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      value: "all",
                      label: "Tất cả",
                      icon: <Users size={16} />,
                    },
                    {
                      value: "role",
                      label: "Theo nhóm",
                      icon: <Megaphone size={16} />,
                    },
                    {
                      value: "individual",
                      label: "Cá nhân",
                      icon: <Bell size={16} />,
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setRecipientType(opt.value);
                      form.setFieldsValue({
                        userId: undefined,
                        roleCode: undefined,
                      });
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all cursor-pointer ${
                      recipientType === opt.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </Form.Item>

            {recipientType === "role" && (
              <Form.Item
                label={
                  <span className="text-sm font-medium text-slate-700">
                    Nhóm vai trò
                    <span className="text-red-500">*</span>
                  </span>
                }
                name="roleCode"
                required={false}
                validateTrigger={["onBlur", "onChange"]}
                rules={[
                  { required: true, message: "Vui lòng chọn nhóm vai trò" },
                ]}
              >
                <Select
                  placeholder="Chọn vai trò..."
                  className="rounded-lg"
                  options={[
                    { label: "Người dân (RESIDENT)", value: "RESIDENT" },
                    { label: "Cán bộ tuần tra (PATROL)", value: "PATROL" },
                    { label: "Cán bộ tăng cường (OFFICER)", value: "OFFICER" },
                    { label: "Nhân viên y tế (STAFF)", value: "STAFF" },
                  ]}
                />
              </Form.Item>
            )}

            {recipientType === "individual" && (
              <Form.Item
                required={false}
                validateTrigger={["onBlur", "onChange"]}
                label={
                  <span className="text-sm font-medium text-slate-700">
                    Chọn người nhận
                    <span className="text-red-500">*</span>
                  </span>
                }
                name="userId"
                rules={[
                  { required: true, message: "Vui lòng chọn người nhận" },
                ]}
              >
                <Select
                  placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                  showSearch
                  optionFilterProp="label"
                  options={users.map((u) => ({
                    value: u.id,
                    label: `${u.fullName} — ${u.phoneNumber} (${u.role?.roleName || "Người dân"})`,
                  }))}
                />
              </Form.Item>
            )}

            <Form.Item
              required={false}
              validateTrigger={["onBlur", "onChange"]}
              label={
                <span className="text-sm font-medium text-slate-700">
                  Tiêu đề thông báo
                  <span className="text-red-500">*</span>
                </span>
              }
              name="title"
              rules={[
                { required: true, message: "Vui lòng nhập tiêu đề" },
                { max: 100, message: "Tiêu đề không quá 100 ký tự" },
              ]}
            >
              <Input
                placeholder="Ví dụ: Cảnh báo triều cường dâng cao..."
                className="rounded-lg"
                size="large"
              />
            </Form.Item>

            <Form.Item
              required={false}
              validateTrigger={["onBlur", "onChange"]}
              label={
                <span className="text-sm font-medium text-slate-700">
                  Nội dung chi tiết
                  <span className="text-red-500">*</span>
                </span>
              }
              name="content"
              rules={[
                { required: true, message: "Vui lòng nhập nội dung chi tiết" },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Nhập nội dung thông báo chi tiết..."
                className="rounded-lg"
              />
            </Form.Item>

            <div className="flex gap-3 pt-2">
              <Button
                size="large"
                className="flex-1 rounded-lg"
                onClick={() => {
                  setIsModalOpen(false);
                  form.resetFields();
                  setRecipientType("all");
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                loading={isSubmitting}
                onClick={handleSend}
                icon={<Send size={15} />}
                className="flex-1 rounded-lg flex items-center justify-center gap-2"
                style={{ background: "#6366f1", borderColor: "#6366f1" }}
              >
                Gửi thông báo
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
