import { type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  DashboardIcon,
  ProductIcon,
  ScheduleIcon,
  ServiceIcon,
} from "@/components/base/icons";
import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronLeft,
  ShieldCheck as ShieldCheckIcon,
  UserIcon,
} from "lucide-react";

type MenuItem = {
  key: string;
  label: string;
  icon: (isActive: boolean) => ReactNode;
  path?: string;
  badge?: string;
};

import { Role } from "@/enums";
import { getProfileApi } from "@/pages/profile/api";
import { useQuery } from "@tanstack/react-query";
import { Tooltip } from "antd";

type MenuProps = {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function Menu({
  isOpen = true,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: MenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfileApi();
      return response?.data;
    },
  });

  const menuItems: MenuItem[] = [
    {
      key: "dashboard",
      label: "Trang chủ",
      icon: (isActive: boolean) => (
        <DashboardIcon height={22} width={22} isActive={isActive} />
      ),
      path: "/app/dashboard",
    },

    {
      key: "reflection",
      label: "Quản lý phản ánh",
      icon: (isActive: boolean) => (
        <ServiceIcon height={22} width={22} isActive={isActive} />
      ),
      path: "/app/reflection-manager/list",
    },
    ...(profileData?.role.roleCode === Role.ADMIN ||
    profileData?.role.roleCode === Role.LEADER ||
    profileData?.role.roleCode === Role.MANAGER
      ? [
          {
            key: "verification",
            label: "Quản lý xác thực",
            icon: (isActive: boolean) => (
              <ShieldCheckIcon
                height={22}
                width={22}
                className={isActive ? "text-white" : "text-sky-400"}
              />
            ),
            path: "/app/verification-manager/list",
          },
        ]
      : []),
    ...(profileData?.role.roleCode === Role.ADMIN ||
    profileData?.role.roleCode === Role.MANAGER
      ? [
          {
            key: "dispatch",
            label: "Quản lý điều chuyển",
            icon: (isActive: boolean) => (
              <ArrowRightLeft
                height={22}
                width={22}
                className={isActive ? "text-white" : "text-sky-400"}
              />
            ),
            path: "/app/dispatch-manager/list",
          },
        ]
      : []),
    // Chỉ hiển thị menu thiệt hại cho cư dân (RESIDENT)
    // ADMIN/MANAGER/LEADER xem thiệt hại trong chi tiết cư dân
    ...(profileData?.role.roleCode === Role.RESIDENT
      ? [
          {
            key: "flood-damages",
            label: "Quản lý thiệt hại",
            icon: (isActive: boolean) => (
              <AlertTriangle
                size={22}
                className={isActive ? "text-white" : "text-sky-400"}
              />
            ),
            path: "/app/flood-damages-manager/list",
          },
        ]
      : []),
    ...(profileData?.role.roleCode === Role.ADMIN ||
    profileData?.role.roleCode === Role.MANAGER
      ? [
          {
            key: "human-resources",
            label: "Quản lý nhân sự",
            icon: (isActive: boolean) => (
              <ProductIcon height={22} width={22} isActive={isActive} />
            ),
            path: "/app/human-resources-manager/list",
          },
        ]
      : []),
    ...(profileData?.role.roleCode === Role.ADMIN ||
    profileData?.role.roleCode === Role.MANAGER
      ? [
          {
            key: "residents",
            label: "QL dân cư và y tế",
            icon: (isActive: boolean) => (
              <ScheduleIcon height={22} width={22} isActive={isActive} />
            ),
            path: "/app/residents-manager/list",
          },
        ]
      : []),
    ...(profileData?.role.roleCode === Role.ADMIN
      ? [
          {
            key: "account",
            label: "QL tài khoản",
            icon: (isActive: boolean) => (
              <UserIcon
                height={22}
                width={22}
                className={isActive ? "text-white" : "text-sky-400"}
              />
            ),
            path: "/app/account-manager/list",
          },
        ]
      : []),
  ];

  // Tính toán activeKey trực tiếp từ URL thay vì dùng state để tránh re-render thừa
  const activeKey =
    menuItems.find((item) => {
      if (!item.path) return false;
      const basePath = item.path.replace(/\/list$/, "");
      return location.pathname.startsWith(basePath);
    })?.key || "dashboard";

  const handleClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
      // Đóng menu trên mobile sau khi chọn
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <>
      {/* Overlay cho mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-100 xl:hidden transition-opacity duration-300"
        />
      )}
      <menu
        className={`fixed xl:top-0 top-[64px] left-0 flex h-screen flex-col bg-[linear-gradient(180deg,#0e2d4d_0%,#113c6b_100%)] text-white shadow-2xl shadow-[#0c1f36]/40 z-100 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[72px]" : "w-[230px] md:w-[240px]"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"} xl:translate-x-0`}
      >
        <div
          className={`flex items-center justify-center p-4 ${collapsed ? "h-16" : ""}`}
        >
          <div className="flex justify-center items-center overflow-hidden">
            <img
              src="/image-logo.png"
              alt="logo"
              className={`h-auto object-contain mix-blend-screen shrink-0 transition-all duration-300 ${
                collapsed ? "w-0 opacity-0" : "w-28 xl:w-36 opacity-100"
              }`}
            />
          </div>
        </div>
        <nav className="flex-1 space-y-2 px-3 py-4">
          {menuItems.map((item) => {
            const isActive = activeKey === item.key;
            const button = (
              <button
                key={item.key}
                onClick={() => handleClick(item)}
                className={`group flex w-full items-center rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                  collapsed ? "justify-center px-2" : "gap-3"
                } ${
                  isActive
                    ? "bg-white/15 backdrop-blur text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]"
                    : "text-white/80 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-lg border transition shrink-0 ${
                    isActive
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-white/5 group-hover:border-white/25"
                  }`}
                >
                  {item.icon(isActive)}
                </span>
                <span
                  className={`flex-1 text-sm font-semibold tracking-wide transition-all duration-300 whitespace-nowrap ${
                    collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                  }`}
                >
                  {item.label}
                </span>
                {item.badge && !collapsed ? (
                  <span className="rounded-full bg-amber-400/90 px-2.5 py-0.5 text-xs font-semibold text-[#0d2f56]">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );

            return collapsed ? (
              <Tooltip key={item.key} title={item.label} placement="right">
                {button}
              </Tooltip>
            ) : (
              button
            );
          })}
          <div
            className="flex cursor-pointer justify-center items-center py-2"
            onClick={onToggleCollapse}
          >
            <Tooltip title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}>
              <span
                className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              >
                <ChevronLeft size={20} />
              </span>
            </Tooltip>
          </div>
        </nav>
        <div
          className={`hidden xl:block px-4 pb-6 pt-2 transition-all duration-300 ${collapsed ? "opacity-0 overflow-hidden h-0 p-0" : "opacity-100"}`}
        >
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80">
            <div className="font-semibold text-white">Trung tâm cảnh báo</div>
            <p className="mt-1 leading-relaxed">
              Theo dõi thời gian thực tình hình mưa, mực nước và các cảnh báo
              ngập úng trên toàn hệ thống.
            </p>
          </div>
        </div>
      </menu>
    </>
  );
}
