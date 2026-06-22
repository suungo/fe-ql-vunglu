import React, { useEffect, useState } from "react";
import { Modal, Avatar, Typography, Row, Col, Statistic, Spin } from "antd";
import { ShieldCheck, Calendar, MapPin, Award } from "lucide-react";
import { BASE_URL } from "@/apis";

const { Title, Text } = Typography;

const getReputationLevel = (points: number) => {
  if (points === 10)
    return {
      label: "Xuất sắc",
      color: "success",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    };
  if (points >= 8)
    return {
      label: "Tốt",
      color: "processing",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    };
  if (points >= 5)
    return {
      label: "Trung bình",
      color: "warning",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    };
  if (points > 0)
    return {
      label: "Cảnh cáo",
      color: "error",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    };
  return {
    label: "Tạm khóa",
    color: "default",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
  };
};

export const UserProfileModal = ({
  userId,
  open,
  onClose,
}: {
  userId: number | null;
  open: boolean;
  onClose: () => void;
}) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      Promise.all([
        BASE_URL.get(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }).catch(() => null),
        BASE_URL.get(`/reports`, {
          params: { userId, limit: 3, sortBy: "createdAt", order: "DESC" },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }).catch(() => null),
      ])
        .then(([userRes, reportsRes]) => {
          if (userRes?.data?.data) setUserData(userRes.data.data);
          else if (userRes?.data) setUserData(userRes.data);

          if (reportsRes?.data?.data) {
            setRecentActivities(reportsRes.data.data);
            setTotalReports(
              reportsRes.data.meta?.total || reportsRes.data.data.length,
            );
          } else if (reportsRes?.data) {
            setRecentActivities(reportsRes.data);
            setTotalReports(reportsRes.data.length);
          }
        })
        .catch((err) => {
          console.error("Error fetching user profile", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setUserData(null);
      setRecentActivities([]);
      setTotalReports(0);
    }
  }, [open, userId]);

  if (!open) return null;

  const level = userData
    ? getReputationLevel(userData.reputationPoints ?? 10)
    : getReputationLevel(10);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      className="rounded-3xl overflow-hidden [&_.ant-modal-content]:p-0 [&_.ant-modal-close]:top-5 [&_.ant-modal-close]:right-5"
    >
      {loading || !userData ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spin size="large" />
          <Text className="mt-4 text-slate-400">Đang tải thông tin...</Text>
        </div>
      ) : (
        <div className="flex flex-col items-center pt-10 pb-8 px-6">
          <div className="relative mb-4">
            <Avatar
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`}
              size={96}
              className="border-4 border-white shadow-lg bg-slate-50"
            />
            {userData.role?.roleCode &&
              userData.role.roleCode !== "RESIDENT" && (
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                  <ShieldCheck size={16} />
                </div>
              )}
          </div>

          <Title level={3} className="m-0! text-slate-800 font-extrabold mb-1">
            {userData.fullName || userData.name}
          </Title>
          <Text className="text-slate-500 font-medium mb-3">
            {userData.role?.roleName || "Người dân"}
          </Text>

          {(userData.role?.roleCode === "RESIDENT" || !userData.role) && (
            <div className="mb-5">
              <span
                className={`px-3 py-1 font-semibold text-xs rounded-full border ${level.bg} ${level.text} ${level.border}`}
              >
                Độ uy tín: {level.label}
              </span>
            </div>
          )}

          <div className="flex gap-2 mb-7">
            <div className="flex items-center gap-1.5 bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-100 text-slate-600 text-xs font-medium">
              <Calendar size={14} className="text-slate-400" />
              Tham gia {new Date(userData.createdAt).getFullYear()}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-100 text-slate-600 text-xs font-medium">
              <MapPin size={14} className="text-slate-400" />
              {userData.address
                ? userData.address.split(",").pop()?.trim() || "TP.HCM"
                : "TP.HCM"}
            </div>
          </div>

          <div className="w-full bg-[#f8fafc] rounded-2xl p-4 mb-7 border border-[#f1f5f9]">
            <Row gutter={16} className="text-center">
              <Col span={12}>
                <Statistic
                  title={
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                      Đã báo cáo
                    </span>
                  }
                  value={totalReports}
                  formatter={(value) => (
                    <span className="text-2xl font-black text-slate-800">
                      {value}
                    </span>
                  )}
                />
              </Col>
              <Col span={12} className="border-l border-slate-200">
                <Statistic
                  title={
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                      Uy tín
                    </span>
                  }
                  value={
                    userData.role?.roleCode === "RESIDENT" || !userData.role
                      ? (userData.reputationPoints ?? 10)
                      : 10
                  }
                  formatter={(value) => (
                    <span className="text-2xl font-black text-blue-600">
                      {userData.role?.roleCode === "RESIDENT" || !userData.role
                        ? `${value}/10`
                        : value}
                    </span>
                  )}
                  suffix={
                    <Award
                      size={18}
                      className="inline text-amber-500 ml-1 mb-1"
                    />
                  }
                />
              </Col>
            </Row>
          </div>

          <div className="w-full">
            <Text className="block mb-3 text-sm font-extrabold text-slate-800">
              Hoạt động gần đây
            </Text>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#f0f9ff] flex items-center justify-center shrink-0 border border-[#e0f2fe]">
                      <MapPin size={16} className="text-blue-500" />
                    </div>
                    <div className="flex-1 overflow-hidden pt-0.5">
                      <Text className="block text-[13px] font-bold text-slate-700 truncate mb-0.5">
                        {activity.title ||
                          `Cảnh báo ngập tại ${activity.address}`}
                      </Text>
                      <Text className="block text-xs text-slate-500 font-medium">
                        {new Date(activity.createdAt).toLocaleDateString(
                          "vi-VN",
                        )}{" "}
                        •{" "}
                        {activity.status === "RESOLVED"
                          ? "Đã khắc phục"
                          : activity.status === "APPROVED"
                            ? "Đã duyệt"
                            : "Đang xử lý"}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Text className="text-sm text-slate-400 font-medium">
                  Chưa có hoạt động nào
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
