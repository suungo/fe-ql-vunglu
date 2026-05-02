import { BASE_URL } from "@/apis";
import { logoutApi } from "@/pages/auth/login/apis";
import FormChangePassword from "@/pages/profile/components/FormChangePassword";
import { clearDeviceId, getDeviceId } from "@/utils/device";
import {
  Button,
  List,
  message,
  Modal,
  Popover,
  Tooltip,
  type MenuProps,
} from "antd";
import Dropdown from "antd/es/dropdown/dropdown";
import {
  Eye,
  Info,
  LockKeyhole,
  Menu as MenuIcon,
  Power,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  reflectionId?: string;
  damageId?: string;
  referenceId?: string;
}

const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.7}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.657a2 2 0 01-3.714 0M6.5 9a5.5 5.5 0 1111 0c0 1.764.394 3.134 1.154 4.126.4.523.613 1.16.596 1.813-.024.91-.757 1.561-1.667 1.561H6.417c-.91 0-1.643-.65-1.667-1.56a2.74 2.74 0 01.596-1.814C6.106 12.134 6.5 10.764 6.5 9z"
    />
  </svg>
);

type HeaderProps = {
  onMenuToggle?: () => void;
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  // const [isConnected, setIsConnected] = useState(false);
  const [alertsCount, setAlertsCount] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpenModalLogout, setIsOpenModalLogout] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isOpenModalChangePassword, setIsOpenModalChangePassword] =
    useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const [countRes, listRes] = await Promise.all([
        BASE_URL.get("/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        BASE_URL.get("/notifications?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (countRes.data?.data?.unread !== undefined) {
        setAlertsCount(countRes.data.data.unread);
      }
      if (listRes.data?.data) {
        setNotifications(listRes.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, []);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      await BASE_URL.patch(
        "/notifications/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchUnreadCount();
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };
  const notificationTypeMap: Record<string, string> = {
    NEW_REFLECTION: "Phản ánh mới",
    VERIFICATION_REQUEST: "Yêu cầu xác minh",
    VERIFICATION_APPROVED: "Yêu cầu xác minh đã được duyệt",
    VERIFICATION_REJECTED: "Yêu cầu xác minh đã bị từ chối",
    VERIFICATION_COMPLETED: "Yêu cầu xác minh đã hoàn thành",
  };
  const handleNotificationClick = async (item: Notification) => {
    // 1. Mark as read
    try {
      const token = localStorage.getItem("accessToken");
      if (token && !item.isRead) {
        await BASE_URL.patch(
          `/notifications/${item.id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        // Cập nhật lại UI tạm thời trước khi fetch chạy lại
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
        setAlertsCount((prev) => (prev && prev > 0 ? prev - 1 : null));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }

    // 2. Navigate
    if (item.type === "NEW_REFLECTION" || item.type === "NEARBY_REFLECTION") {
      if (item.referenceId) {
        navigate(`/app/reflection-manager/detail/${item.referenceId}`);
      } else {
        navigate(`/app/reflection-manager/list`);
      }
    } else {
      navigate(`/app/reflection-manager/list`);
    }
  };

  const showNotificationDetail = async (
    item: Notification,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click vào item (điều hướng)
    setSelectedNotification(item);

    if (!item.isRead) {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          await BASE_URL.patch(
            `/notifications/${item.id}/read`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
          );
          setAlertsCount((prev) => (prev && prev > 0 ? prev - 1 : null));
        }
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    }
  };

  const notificationContent = (
    <div className="w-[300px] md:w-[350px] max-h-[400px] overflow-y-auto">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <span className="font-semibold text-[16px]">Thông báo</span>
        {alertsCount && alertsCount > 0 ? (
          <Button
            type="link"
            size="small"
            onClick={markAllAsRead}
            className="text-[12px] p-0"
          >
            Đánh dấu đã đọc
          </Button>
        ) : null}
      </div>
      <List
        size="small"
        dataSource={notifications}
        locale={{ emptyText: "Không có thông báo nào" }}
        renderItem={(item) => (
          <List.Item
            className={`px-2 py-3 hover:bg-gray-50 transition-colors ${!item.isRead ? "bg-blue-50/30" : ""}`}
            extra={
              <Button
                type="text"
                size="small"
                className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-100"
                icon={<Eye size={16} className="text-blue-600" />}
                onClick={(e) => showNotificationDetail(item, e)}
                title="Xem chi tiết"
              />
            }
          >
            <List.Item.Meta
              className="cursor-pointer px-2"
              title={
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={`text-[13px] line-clamp-2 leading-tight ${!item.isRead ? "font-semibold text-gray-800" : "text-gray-600 font-medium"}`}
                  >
                    {item?.title}
                  </span>
                  {!item.isRead && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1" />
                  )}
                </div>
              }
              description={
                <div className="mt-1 flex flex-col gap-1">
                  <span className="text-[12px] font-normal text-gray-500 line-clamp-2">
                    {item?.content}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(item.createdAt as string).toLocaleString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  useEffect(() => {
    // Wrap in queueMicrotask to avoid synchronous setState in effect body
    queueMicrotask(() => {
      fetchUnreadCount();
    });

    // Thiết lập kết nối Socket.io cho thông báo
    const token = localStorage.getItem("accessToken");
    let socket: Socket | null = null;

    if (token) {
      const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      socket = io(`${socketUrl}/notifications`, {
        auth: { token },
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        console.log("Connected to notification socket");
      });

      socket.on("newNotification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setAlertsCount((prev) => (prev || 0) + 1);

        // Hiển thị thông báo nhỏ ở góc màn hình (optional)
        message.info({
          content: (
            <div onClick={() => setSelectedNotification(notification)}>
              <p className="font-bold mb-0">{notification.title}</p>
              <p className="text-xs">{notification.content}</p>
            </div>
          ),
          icon: <BellIcon />,
          duration: 5,
        });
      });

      socket.on("connect_error", (error: Error) => {
        console.error("Socket connection error:", error);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [fetchUnreadCount]);

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Dropwdown menu items
  const dropdownItems: MenuProps["items"] = useMemo(
    () => [
      {
        label: (
          <div className="flex items-center gap-2 p-2">
            <UserRound size={18} className="text-gray-700" />
            <span>Thông tin cá nhân</span>
          </div>
        ),
        key: "profile",
        onClick: () => navigate("/app/profile-manager/detail"),
      },
      {
        label: (
          <div
            onClick={() => setIsOpenModalChangePassword(true)}
            className="flex items-center gap-2 p-2"
          >
            <LockKeyhole size={18} className="text-gray-700" />
            <span>Đổi mật khẩu</span>
          </div>
        ),
        key: "change-password",
      },

      {
        label: (
          <div
            onClick={() => setIsOpenModalLogout(true)}
            className="flex items-center gap-2 p-2"
          >
            <Power size={18} className="text-gray-700" />
            <span>Đăng xuất</span>
          </div>
        ),
        key: "logout",
      },
    ],
    [navigate],
  );

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
          <div className="flex justify-center mb-2 bg-[#FAFAFA]!">
            <img
              loading="lazy"
              alt="Image Auth"
              className="lg:w-[217px] lg:h-[139px] md:w-[143px] md:h-[90px] w-[101px] rounded-[10px] h-[70px] mix-blend-multiply"
              src="/image-logo.png"
            />
          </div>
          <h3 className="lg:text-[30px] text-[24px] mb-2 text-center font-semibold text-[#144c65]">
            Đổi mật khẩu
          </h3>
          <FormChangePassword
            onCancel={() => setIsOpenModalChangePassword(false)}
          />
        </div>
      </Modal>
      {/* Modal đăng xuất */}
      <Modal
        open={isOpenModalLogout}
        onCancel={() => setIsOpenModalLogout(false)}
        title={<h1 className="text-2xl font-bold"> Đăng xuất</h1>}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              className="h-10!"
              onClick={() => setIsOpenModalLogout(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                try {
                  // 🔥 Gọi API logout với deviceId
                  const deviceId = getDeviceId();
                  await logoutApi(deviceId || undefined);

                  // Xóa localStorage
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("user");
                  clearDeviceId(); // Xóa deviceId

                  navigate("/login");
                } catch (error) {
                  console.error("Logout error:", error);
                  // Vẫn logout local ngay cả khi API lỗi
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("user");
                  clearDeviceId();
                  navigate("/login");
                }
              }}
              type="primary"
              className="h-10!"
            >
              Đăng xuất
            </Button>
          </div>
        }
      >
        <div>Bạn có chắc chắn muốn đăng xuất không?</div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BellIcon />
            </div>
            <span className="text-lg font-bold">Chi tiết thông báo</span>
          </div>
        }
        open={!!selectedNotification}
        onCancel={() => setSelectedNotification(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              key="close"
              type="primary"
              onClick={() => setSelectedNotification(null)}
            >
              Đóng
            </Button>
            {selectedNotification?.referenceId && (
              <Button
                key="go"
                onClick={() => {
                  handleNotificationClick(selectedNotification);
                  setSelectedNotification(null);
                }}
              >
                Đi đến trang liên quan
              </Button>
            )}
          </div>
        }
        width={500}
      >
        {selectedNotification && (
          <div className="py-4 space-y-4">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                Tiêu đề
              </p>
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedNotification.title}
              </h2>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Nội dung
              </p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.content}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Info size={14} />
                <span>
                  Loại:{" "}
                  {
                    notificationTypeMap[
                      selectedNotification.type as keyof typeof notificationTypeMap
                    ]
                  }
                </span>
              </div>
              <span>
                {new Date(selectedNotification.createdAt).toLocaleString(
                  "vi-VN",
                )}
              </span>
            </div>
          </div>
        )}
      </Modal>
      <header className="sticky top-0 z-1000 flex h-16 items-center justify-between bg-[linear-gradient(90deg,#1a5d9f_0%,#1b75c8_100%)] px-3 md:px-6 text-white shadow-lg">
        <div className="flex items-center gap-2 md:gap-4 xl:gap-6">
          {/* Hamburger button cho mobile */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="xl:hidden grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition"
              aria-label="Mở menu"
            >
              <MenuIcon size={18} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                // isConnected ? "bg-emerald-400" : "bg-rose-400"
                "bg-emerald-400"
              }`}
            />
            <div className="text-sm md:text-lg font-semibold tracking-wide">
              {time}
            </div>
          </div>
          <div className="hidden md:block rounded-full bg-white/15 px-3 py-1 text-xs lg:text-sm">
            {date}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 rounded-full bg-white/10 px-2 md:px-4 py-1">
            <Popover
              content={notificationContent}
              trigger="hover"
              placement="bottomRight"
              overlayClassName="notification-popover"
            >
              <div className="relative cursor-pointer">
                <BellIcon />
                {alertsCount && alertsCount > 0 ? (
                  <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-[#0d2f56]">
                    {alertsCount > 99 ? "99+" : alertsCount}
                  </span>
                ) : (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
                )}
              </div>
            </Popover>
            <Dropdown
              arrow
              menu={{ items: dropdownItems }}
              className="cursor-pointer"
              placement="bottomRight"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-8 w-8 rounded-full bg-white/30 overflow-hidden">
                  <img
                    src="/avatar-trang-4 1.png"
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </span>
                <span className="hidden sm:inline-block max-w-[100px] truncate">
                  {user?.fullName}
                </span>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>
    </>
  );
}
