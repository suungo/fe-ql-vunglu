import { Gender, Role } from "@/enums";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Modal,
  Spin,
  Tooltip,
  Tabs,
  Table,
  Tag,
  Popconfirm,
  message,
} from "antd";
import dayjs from "dayjs";
import {
  Edit3,
  KeyRound,
  X,
  Laptop,
  Smartphone,
  LogOut,
  Globe,
  Award,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import {
  getProfileApi,
  getUserDevicesApi,
  deactivateDeviceApi,
  getReputationHistoryApi,
} from "../api";
import FormChangePassword from "../components/FormChangePassword";
import FormManagerUpdateProfile from "../components/FormManagerProfile";
import { ProfileStatus } from "../enum";
import { getDeviceId } from "@/utils/device";
import type { UserDevice } from "../interfaces";

export default function DetailProfile() {
  const [isOpenModalUpdate, setIsOpenModalUpdate] = useState(false);
  const [isOpenModalChangePassword, setIsOpenModalChangePassword] =
    useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const currentDeviceId = getDeviceId();

  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const { data: reputationHistory = [], isLoading: isHistoryLoading } =
    useQuery({
      queryKey: ["reputationHistory"],
      queryFn: async () => {
        const response = await getReputationHistoryApi();
        return response?.data || [];
      },
    });

  const {
    data: devicesData = [],
    isLoading: isDevicesLoading,
    refetch: refetchDevices,
  } = useQuery<UserDevice[]>({
    queryKey: ["userDevices"],
    queryFn: async () => {
      const response = await getUserDevicesApi();
      return response?.data || [];
    },
  });

  const handleDeactivateDevice = async (deviceId: string) => {
    setIsDeactivating(true);
    try {
      await deactivateDeviceApi(deviceId);
      message.success("Đã đăng xuất thiết bị thành công!");
      refetchDevices();
    } catch (error) {
      console.error("Lỗi khi đăng xuất thiết bị:", error);
      message.error("Đăng xuất thiết bị thất bại. Vui lòng thử lại!");
    } finally {
      setIsDeactivating(false);
    }
  };

  const deviceColumns = [
    {
      title: "Thiết bị",
      key: "deviceInfo",
      render: (_: any, record: UserDevice) => {
        const isCurrent = record.deviceId === currentDeviceId;
        const isMobile = record.deviceType === "mobile";

        return (
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isCurrent ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}
            >
              {isMobile ? <Smartphone size={20} /> : <Laptop size={20} />}
            </div>
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                {record.deviceName ||
                  (isMobile ? "Thiết bị di động" : "Trình duyệt Web")}
                {isCurrent && (
                  <Tag color="success" className="m-0 font-normal">
                    Thiết bị này
                  </Tag>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {record.deviceType === "mobile"
                  ? "Ứng dụng Di động"
                  : "Trình duyệt Web"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Địa chỉ IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      render: (ip?: string) => (
        <span className="font-mono text-slate-600">{ip || "—"}</span>
      ),
    },
    {
      title: "Trình duyệt / Hệ điều hành",
      dataIndex: "userAgent",
      key: "userAgent",
      render: (ua?: string) => {
        if (!ua) return <span className="text-slate-400">—</span>;

        let os = "OS không xác định";
        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Macintosh")) os = "macOS";
        else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("Linux")) os = "Linux";

        let browser = "Trình duyệt không xác định";
        if (ua.includes("Edg/")) browser = "Edge";
        else if (ua.includes("Chrome/")) browser = "Chrome";
        else if (ua.includes("Safari/")) browser = "Safari";
        else if (ua.includes("Firefox/")) browser = "Firefox";

        return (
          <Tooltip title={ua}>
            <span className="text-slate-600 cursor-help flex items-center gap-1.5">
              <Globe size={14} className="text-slate-400" />
              {browser} ({os})
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Hoạt động cuối cùng",
      dataIndex: "lastActiveAt",
      key: "lastActiveAt",
      render: (date?: string) =>
        date ? dayjs(date).format("HH:mm - DD/MM/YYYY") : "—",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: UserDevice) => {
        const isCurrent = record.deviceId === currentDeviceId;
        if (isCurrent) return null;

        return (
          <Popconfirm
            title="Đăng xuất thiết bị"
            description="Bạn có chắc chắn muốn đăng xuất tài khoản khỏi thiết bị này không?"
            onConfirm={() => handleDeactivateDevice(record.deviceId)}
            okText="Đồng ý"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: isDeactivating }}
          >
            <Button
              type="text"
              danger
              icon={<LogOut size={16} />}
              className="flex items-center gap-1.5 hover:bg-rose-50"
            >
              Đăng xuất
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  const getRoleText = (role?: Role) => {
    switch (role) {
      case Role.ADMIN:
        return "Quản trị viên";
      case Role.MANAGER:
        return "Quản lý phường";
      case Role.OFFICER:
        return "Cán bộ tăng cường";
      case Role.INSPECTOR:
        return "Cán bộ hậu kiểm";
      case Role.PATROL:
        return "Cán bộ tuần tra";
      case Role.LEADER:
        return "Tình nguyện viên";
      case Role.STAFF:
        return "Nhân viên y tế";
      default:
        return "Người dân";
    }
  };

  const getReputationTag = (points: number) => {
    if (points === 10)
      return (
        <Tag color="success" className="font-bold">
          {points}/10 (Xuất sắc)
        </Tag>
      );
    if (points >= 8)
      return (
        <Tag color="blue" className="font-semibold">
          {points}/10 (Tốt)
        </Tag>
      );
    if (points >= 5)
      return (
        <Tag color="warning" className="font-medium">
          {points}/10 (Trung bình)
        </Tag>
      );
    if (points > 0)
      return (
        <Tag color="gold" className="font-bold">
          {points}/10 (Cảnh cáo)
        </Tag>
      );
    return (
      <Tag color="error" className="font-bold">
        {points}/10 (Tạm khóa)
      </Tag>
    );
  };
  if (isLoading) return <Spin />;
  return (
    <>
      {/* Modal đổi mật khẩu */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        open={isOpenModalChangePassword}
        className="lg:w-[655px] md:w-[555px] w-[335px]"
        onCancel={() => setIsOpenModalChangePassword(false)}
        footer={null}
      >
        <div className="z-50 bg-white rounded-[20px] shadow-sm  transition-all duration-100 ease-in-out">
          <Tooltip placement="bottomRight" title="Đóng" arrow={false}>
            <div
              onClick={() => setIsOpenModalChangePassword(false)}
              className="cursor-pointer flex justify-end"
            >
              <X className="text-slate-700 hover:text-slate-600" size={24} />
            </div>
          </Tooltip>
          <div className="relative flex justify-center mb-2 gap-1">
            <div className="lg:w-[180px] lg:h-[180px] w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50">
              <img
                loading="lazy"
                alt="Image Auth"
                className="w-[105%] h-[105%] max-w-[105%] object-cover"
                src="/image-logo.png"
              />
            </div>
          </div>
          <h3 className="lg:text-[30px] text-[24px] mb-2 text-center font-semibold text-[#144c65]">
            Đổi mật khẩu
          </h3>
          <FormChangePassword
            onCancel={() => setIsOpenModalChangePassword(false)}
          />
        </div>
      </Modal>

      {/* Modal cập nhật thông tin cá nhân */}
      <Modal
        centered
        maskClosable={false}
        closeIcon={false}
        className="xl:min-w-[1108px] lg:min-w-[960px] z-100 my-10"
        title={
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px]">
              Cập nhật thông tin
            </h3>
            <Tooltip placement="bottom" title="Đóng" arrow={false}>
              <div
                onClick={() => setIsOpenModalUpdate(false)}
                className="hover:bg-gray-200 p-2 transition-all cursor-pointer rounded-full"
              >
                <X className="text-slate-700 hover:text-slate-600" size={24} />
              </div>
            </Tooltip>
          </div>
        }
        open={isOpenModalUpdate}
        footer={null}
      >
        <FormManagerUpdateProfile
          onCancel={() => setIsOpenModalUpdate(false)}
          initialValues={profileData}
          onSuccess={() => refetch()}
        />
      </Modal>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white/80 p-6 shadow-[0_20px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: "info",
                label: (
                  <span className="flex items-center gap-2 text-[16px] font-medium py-1">
                    👤 Thông tin cá nhân
                  </span>
                ),
                children: (
                  <div className="pt-4">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          Thông tin cá nhân
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="primary"
                          icon={<Edit3 size={16} />}
                          onClick={() => setIsOpenModalUpdate(true)}
                          className="h-9! font-medium text-[15px]"
                        >
                          Cập nhật thông tin
                        </Button>

                        <Button
                          type="default"
                          icon={<KeyRound size={16} />}
                          onClick={() => setIsOpenModalChangePassword(true)}
                          className="h-9! font-medium text-[15px]"
                        >
                          Đổi mật khẩu
                        </Button>
                      </div>
                    </div>

                    <div>
                      <ul className="flex flex-col gap-2">
                        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                          <li className="flex items-center gap-[44px]">
                            <span className="text-[16px] text-[#ACACAC]">
                              Họ và tên:
                            </span>
                            <span className="text-[16px] text-[#000000]">
                              {profileData?.fullName}
                            </span>
                          </li>
                          <li className="flex items-center gap-4">
                            <span className="text-[16px] text-[#ACACAC]">
                              Số điện thoại:
                            </span>
                            <span className="text-[16px] text-[#000000]">
                              {profileData?.phoneNumber}
                            </span>
                          </li>
                        </div>
                        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                          <li className="flex items-center gap-[79px]">
                            <span className="text-[16px] text-[#ACACAC]">
                              Email:
                            </span>
                            <span className="text-[16px] text-[#000000]">
                              {profileData?.email}
                            </span>
                          </li>
                          <li className="flex items-center gap-[58px]">
                            <span className="text-[16px] text-[#ACACAC]">
                              Giới tính:
                            </span>
                            <span className="text-[16px] text-[#000000]">
                              {profileData?.gender === Gender.MALE
                                ? "Nam"
                                : "Nữ"}
                            </span>
                          </li>
                        </div>
                        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                          <li className="flex items-center gap-[44px]">
                            <span className="text-[16px] text-[#ACACAC]">
                              Ngày sinh:
                            </span>
                            <span className="text-[16px] text-[#000000]">
                              {profileData?.dateBirth
                                ? dayjs(profileData?.dateBirth).format(
                                    "DD/MM/YYYY",
                                  )
                                : "Chưa cập nhật"}
                            </span>
                          </li>
                          <li className="flex items-center gap-[67px]">
                            <span className="text-[16px] text-[#ACACAC]">
                              Địa chỉ:
                            </span>
                            <span className="text-[16px] text-[#000000]">
                              {profileData?.address || "Chưa cập nhật"}
                            </span>
                          </li>
                        </div>
                        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                          <li className="flex items-center gap-[71px]">
                            <span className="text-[16px] text-[#ACACAC]">
                              Vai trò:
                            </span>
                            <span className="text-[16px] text-[#000000]">
                              {getRoleText(profileData?.role?.roleCode)}
                            </span>
                          </li>
                          <li className="flex items-center gap-[43px]">
                            <span className="text-[16px] text-[#ACACAC]">
                              Trạng thái:
                            </span>
                            <span
                              className={`text-[16px] ${
                                profileData?.status === ProfileStatus.ACTIVE
                                  ? "text-green-500"
                                  : "text-shadow-amber-400"
                              }`}
                            >
                              {profileData?.status === ProfileStatus.ACTIVE
                                ? "Đang hoạt động"
                                : "Tạm ngừng hoạt động"}
                            </span>
                          </li>
                        </div>
                        <li className="flex items-center gap-[51px]">
                          <span className="text-[16px] text-[#ACACAC]">
                            Ngày tạo:
                          </span>
                          <span className="text-[16px] text-[#000000]">
                            {dayjs(profileData?.createdAt).format("DD/MM/YYYY")}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ),
              },
              {
                key: "devices",
                label: (
                  <span className="flex items-center gap-2 text-[16px] font-medium py-1">
                    🛡️ Lịch sử đăng nhập
                    {devicesData?.length ? (
                      <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-semibold">
                        {devicesData.length}
                      </span>
                    ) : null}
                  </span>
                ),
                children: (
                  <div className="pt-4">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-slate-800 mb-1">
                        Thiết bị và Lịch sử đăng nhập
                      </h2>
                    </div>

                    <Table
                      dataSource={devicesData}
                      columns={deviceColumns}
                      rowKey="deviceId"
                      loading={isDevicesLoading}
                      pagination={false}
                      className="border border-slate-100 rounded-xl overflow-hidden shadow-sm"
                      locale={{
                        emptyText: "Chưa ghi nhận lịch sử đăng nhập nào",
                      }}
                    />
                  </div>
                ),
              },
              ...(profileData?.role?.roleCode === Role.RESIDENT
                ? [
                    {
                      key: "reputation",
                      label: (
                        <span className="flex items-center gap-2 text-[16px] font-medium py-1">
                          🏆 Điểm uy tín & Lịch sử
                        </span>
                      ),
                      children: (
                        <div className="pt-4 space-y-6">
                          <div className="mb-4">
                            <h2 className="text-xl font-bold text-slate-800 mb-1">
                              Điểm uy tín & Lịch sử biến động
                            </h2>
                            <p className="text-sm text-slate-500">
                              Hệ thống tự động chấm điểm uy tín cho người dân
                              dựa trên mức độ tin cậy của phản ánh được gửi lên
                              hệ thống.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Cột trái: Điểm hiện tại & Trạng thái */}
                            <div className="lg:col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-slate-100 shadow-inner mb-4">
                                <span className="text-3xl font-black text-slate-800">
                                  {profileData?.reputationPoints ?? 10}
                                </span>
                                <span className="text-slate-400 text-sm ml-0.5">
                                  /10
                                </span>
                              </div>

                              <div className="mb-3">
                                {getReputationTag(
                                  profileData?.reputationPoints ?? 10,
                                )}
                              </div>

                              <p className="text-xs text-slate-500 max-w-[200px] mb-0 leading-relaxed">
                                {profileData?.reputationPoints === 0
                                  ? "Tài khoản bị tạm khóa chức năng tạo phản ánh trong 15 ngày."
                                  : profileData?.reputationPoints < 5
                                    ? "Điểm uy tín thấp. Bạn sẽ nhận được cảnh báo khi gửi phản ánh."
                                    : "Điểm uy tín tốt. Tiếp tục phát huy để đóng góp cho cộng đồng."}
                              </p>

                              {profileData?.reputationPoints === 0 &&
                                profileData?.reputationBlockedUntil && (
                                  <div className="mt-4 p-2 bg-red-100/50 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-red-200">
                                    <Calendar size={14} />
                                    Mở khóa dự kiến:{" "}
                                    {dayjs(
                                      profileData.reputationBlockedUntil,
                                    ).format("DD/MM/YYYY")}
                                  </div>
                                )}
                            </div>

                            {/* Cột phải: Bảng quy tắc cộng trừ điểm */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                              <h4 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">
                                Quy tắc tích lũy và trừ điểm
                              </h4>

                              <div className="space-y-3 text-xs text-slate-600">
                                <div className="flex items-start gap-2.5">
                                  <span className="bg-slate-100 text-slate-700 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                    1
                                  </span>
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      Điểm khởi tạo mặc định:
                                    </span>{" "}
                                    10 điểm khi tạo tài khoản.
                                  </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                  <span className="bg-red-50 text-red-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                    -1
                                  </span>
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      Hệ thống AI từ chối:
                                    </span>{" "}
                                    Trừ 1 điểm nếu phản ánh bị AI phát hiện spam
                                    hoặc nội dung không hợp lệ.
                                  </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                  <span className="bg-red-50 text-red-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                    -2
                                  </span>
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      Quản lý phường từ chối:
                                    </span>{" "}
                                    Trừ 2 điểm nếu cán bộ/quản lý phường xác
                                    nhận phản ánh sai sự thật, sai lệch.
                                  </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                  <span className="bg-emerald-50 text-emerald-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                    +1
                                  </span>
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      Sự cố hoàn thành:
                                    </span>{" "}
                                    Cộng lại 1 điểm cho mỗi sự cố xử lý thành
                                    công (nếu trước đó đã bị trừ, tối đa 10
                                    điểm).
                                  </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                  <span className="bg-amber-50 text-amber-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                    !
                                  </span>
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      Cảnh cáo (Dưới 5 điểm):
                                    </span>{" "}
                                    Hiển thị cảnh báo uy tín thấp khi người dùng
                                    gửi phản ánh mới.
                                  </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                  <span className="bg-rose-50 text-rose-600 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                    🔒
                                  </span>
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      Khóa tài khoản (0 điểm):
                                    </span>{" "}
                                    Tạm khóa chức năng tạo phản ánh mới trong
                                    vòng 15 ngày.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Danh sách lịch sử biến động điểm */}
                          <div>
                            <h3 className="text-base font-bold text-slate-800 mb-3">
                              Lịch sử biến động điểm uy tín
                            </h3>

                            <Table
                              dataSource={reputationHistory}
                              rowKey="id"
                              loading={isHistoryLoading}
                              pagination={{ pageSize: 5 }}
                              className="border border-slate-100 rounded-xl overflow-hidden shadow-sm"
                              locale={{
                                emptyText:
                                  "Không có lịch sử biến động điểm nào",
                              }}
                              columns={[
                                {
                                  title: "Lý do biến động",
                                  dataIndex: "reason",
                                  key: "reason",
                                  render: (reason) => (
                                    <span className="font-semibold text-slate-700">
                                      {reason}
                                    </span>
                                  ),
                                },
                                {
                                  title: "Thay đổi",
                                  dataIndex: "amount",
                                  key: "amount",
                                  width: 120,
                                  render: (amount: number) => {
                                    const isPositive = amount > 0;
                                    return (
                                      <span
                                        className={`font-black text-sm ${isPositive ? "text-green-600" : "text-red-500"}`}
                                      >
                                        {isPositive ? `+${amount}` : amount}
                                      </span>
                                    );
                                  },
                                },
                                {
                                  title: "Thời gian",
                                  dataIndex: "createdAt",
                                  key: "createdAt",
                                  width: 200,
                                  render: (date) =>
                                    dayjs(date).format("HH:mm - DD/MM/YYYY"),
                                },
                              ]}
                            />
                          </div>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    </>
  );
}
