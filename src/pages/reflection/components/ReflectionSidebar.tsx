import React from "react";
import { Card, Typography } from "antd";
import { User, Calendar } from "lucide-react";
import dayjs from "dayjs";

const { Title } = Typography;

interface ReflectionSidebarProps {
  reflection: any;
  actionPanel: React.ReactNode;
}

export const ReflectionSidebar: React.FC<ReflectionSidebarProps> = ({
  reflection,
  actionPanel,
}) => {
  return (
    <div className="space-y-6">
      {/* Người gửi */}
      <Card className="rounded-2xl mb-4! shadow-sm border-slate-100">
        <Title level={5} className="mb-4!">
          Thông tin bổ sung
        </Title>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <User size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400">Người gửi</div>
              <div className="font-medium text-slate-700">
                {reflection.user?.fullName ||
                  reflection.user?.username ||
                  "Người dùng ẩn danh"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400">Ngày cập nhật</div>
              <div className="font-medium text-slate-700">
                {dayjs(reflection.updatedAt).format("HH:mm DD/MM/YYYY")}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Panel */}
      <Card className="rounded-2xl shadow-sm border-slate-100">
        <Title level={5} className="mb-3!">
          Hành động
        </Title>
        {actionPanel}
      </Card>
    </div>
  );
};
