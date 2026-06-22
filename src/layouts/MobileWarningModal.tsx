import { logoutApi } from "@/pages/auth/login/apis";
import { getProfileApi } from "@/pages/profile/api";
import { clearDeviceId, getDeviceId } from "@/utils/device";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, LogOut, Monitor, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Modal cảnh báo hiển thị khi MANAGER hoặc ADMIN truy cập web trên thiết bị di động.
 * Yêu cầu họ dùng máy tính và cung cấp nút đăng xuất.
 */
export default function MobileWarningModal() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem("dismissMobileWarning") === "true";
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-mobile-check"],
    queryFn: async () => {
      const res = await getProfileApi();
      return res?.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const checkMobile = () => {
      // Coi là mobile nếu chiều rộng < 768px (breakpoint md của Tailwind)
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const roleCode = profile?.role?.roleCode;
  const isManagerOrAdmin = roleCode === "MANAGER" || roleCode === "ADMIN";

  const handleDismiss = () => {
    sessionStorage.setItem("dismissMobileWarning", "true");
    setIsDismissed(true);
  };

  // Chỉ hiển thị khi: là MANAGER/ADMIN VÀ đang dùng thiết bị mobile VÀ chưa bỏ qua cảnh báo
  if (!isManagerOrAdmin || !isMobile || isDismissed) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const deviceId = getDeviceId();
      await logoutApi(deviceId || undefined);
    } catch {
      // Vẫn logout dù API lỗi
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      clearDeviceId();
      setIsLoggingOut(false);
      navigate("/login");
    }
  };

  return (
    /* Overlay che toàn bộ màn hình */
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#0d2f56]/90 backdrop-blur-sm p-5">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Close button at top right */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 z-10 cursor-pointer"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Header gradient */}
        <div className="bg-linear-to-br from-[#1a5d9f] to-[#0d2f56] px-6 pt-8 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-4 border border-white/20">
            <Smartphone size={32} className="text-white" />
          </div>
          <h2 className="text-white text-xl font-bold text-center leading-tight">
            Không hỗ trợ trên di động
          </h2>
          <p className="text-white/70 text-sm text-center mt-1">
            Tài khoản Quản lý phường
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Warning box */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <AlertTriangle
              size={20}
              className="text-amber-500 shrink-0 mt-0.5"
            />
            <p className="text-amber-800 text-sm leading-relaxed">
              Hệ thống <strong>chưa hỗ trợ chính thức</strong> giao diện điện
              thoại cho vai trò này.
            </p>
          </div>

          {/* Instructions */}
          <div className="flex gap-3 items-start bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-6">
            <Monitor size={20} className="text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sky-900 text-sm font-semibold mb-0.5">
                Vui lòng sử dụng máy tính
              </p>
              <p className="text-sky-700 text-xs leading-relaxed">
                Hoặc bạn có thể tiếp tục truy cập bằng giao diện thử nghiệm của
                chúng tôi bên dưới.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-colors duration-200 cursor-pointer"
            >
              {isLoggingOut ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors duration-200 border border-slate-200 cursor-pointer"
            >
              Bỏ qua & Tiếp tục
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
