import { Button } from "antd";
import { AlertCircle, FileSearch, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-[#144c65]/10 rounded-full animate-pulse" />
            <div className="relative w-32 h-32 bg-[#144c65]/5 rounded-full flex items-center justify-center">
              <FileSearch size={64} className="text-[#144c65]" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={20} className="text-red-500" />
            </div>
          </div>
        </div>

        <h1 className="text-8xl font-bold text-[#144c65] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Trang không tồn tại
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="primary"
            icon={<Home size={18} />}
            onClick={() => navigate("/app")}
            className="h-11! px-6! bg-[#144c65] hover:bg-[#144c65]/90!"
          >
            Về trang chủ
          </Button>
          <Button onClick={() => navigate(-1)} className="h-11! px-6!">
            Quay lại
          </Button>
        </div>

        <div className="mt-12 text-sm text-gray-400">
          Nếu bạn nghĩ đây là lỗi, vui lòng liên hệ quản trị viên
        </div>
      </div>
    </div>
  );
}
