import React from "react";
import { Card, Typography } from "antd";
import { ReflectionStatus } from "../enum";
import { Role } from "@/enums";

const { Text, Paragraph } = Typography;

const getTimelineSteps = (reflection: any) => {
  const status: ReflectionStatus = reflection?.status;
  const isRejected = status === ReflectionStatus.REJECTED;
  return [
    {
      key: "PENDING",
      title: "Gửi phản ánh",
      desc: "Hệ thống đã ghi nhận phản ánh.",
      active: true,
      error: false,
    },
    {
      key: "VERIFIED",
      title: isRejected ? "Từ chối" : "Xác minh thực địa",
      desc: isRejected
        ? `Lý do: ${reflection?.rejectReason || "Không hợp lệ"}`
        : "Cán bộ tăng cường đã xác minh sự cố.",
      active:
        isRejected ||
        [
          ReflectionStatus.VERIFIED,
          ReflectionStatus.ASSIGNED,
          ReflectionStatus.IN_PROGRESS,
          ReflectionStatus.COMPLETED,
          ReflectionStatus.RESOLVED,
        ].includes(status),
      error: isRejected,
    },
    {
      key: "ASSIGNED",
      title: "Phân công",
      desc: "Quản lý phường giao cho cán bộ Tuần tra.",
      active: [
        ReflectionStatus.ASSIGNED,
        ReflectionStatus.IN_PROGRESS,
        ReflectionStatus.COMPLETED,
        ReflectionStatus.RESOLVED,
      ].includes(status),
      error: false,
    },
    {
      key: "IN_PROGRESS",
      title: "Xử lý hiện trường",
      desc: `Cán bộ tuần tra thực hiện. ${reflection?.estimatedHandleMinutes ? `(Dự kiến: ${reflection.estimatedHandleMinutes} phút)` : ""}`,
      active: [
        ReflectionStatus.IN_PROGRESS,
        ReflectionStatus.COMPLETED,
        ReflectionStatus.RESOLVED,
      ].includes(status),
      error: false,
    },
    {
      key: "COMPLETED",
      title: "Báo cáo kết quả",
      desc: "Tuần tra báo cáo xong, chờ Quản lý xác nhận.",
      active: [ReflectionStatus.COMPLETED, ReflectionStatus.RESOLVED].includes(
        status,
      ),
      error: false,
    },
    {
      key: "RESOLVED",
      title: "Hoàn thành",
      desc: "Quản lý xác nhận. Sự cố cập nhật bản đồ.",
      active: status === ReflectionStatus.RESOLVED,
      error: false,
    },
  ];
};

interface ReflectionTimelineProps {
  reflection: any;
  roleCode: string;
}

export const ReflectionTimeline: React.FC<ReflectionTimelineProps> = ({
  reflection,
  roleCode,
}) => {
  if (roleCode === "PATROL") return null;

  return (
    <Card
      title="Tiến độ xử lý phản ánh"
      className="rounded-2xl shadow-sm border-slate-100 mb-4!"
    >
      <div className="space-y-0">
        {getTimelineSteps(reflection).map((step, idx, arr) => (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${step.error ? "bg-red-500" : step.active ? "bg-blue-500" : "bg-slate-200"}`}
              />
              {idx < arr.length - 1 && (
                <div
                  className={`w-0.5 flex-1 my-1 ${step.error ? "bg-red-200" : step.active ? "bg-blue-200" : "bg-slate-100"}`}
                  style={{ minHeight: 24 }}
                />
              )}
            </div>
            <div className="pb-5 flex-1">
              <Text
                strong
                className={`text-sm ${step.error ? "text-red-600" : step.active ? "text-slate-900" : "text-slate-400"}`}
              >
                {step.title}
              </Text>
              <Paragraph
                className={`text-xs mt-0.5 mb-0 ${step.error ? "text-red-500" : step.active ? "text-slate-500" : "text-slate-300"}`}
              >
                {step.desc}
              </Paragraph>
              {step.error && (
                <div className="mt-2 p-3 bg-red-50/50 border border-red-100 rounded-lg text-xs space-y-1.5 max-w-md">
                  {roleCode === Role.RESIDENT ? (
                    <>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span>Cán bộ xử lý:</span>
                        <span className="font-semibold text-slate-700">
                          {reflection.officer ? "Cán bộ tăng cường" : "Hệ thống tự động (AI)"}
                        </span>
                      </div>
                      {reflection.officer && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span>Mã số cán bộ:</span>
                          <span className="font-mono bg-red-100/60 px-1.5 py-0.5 rounded text-red-700 font-semibold">
                            {reflection.officer.employeeCode}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span>Họ và tên cán bộ:</span>
                        <span className="font-semibold text-slate-800">
                          {reflection.officer?.fullName || "Hệ thống tự động (AI)"}
                        </span>
                      </div>
                      {reflection.officer && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span>Mã nhân sự:</span>
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                            {reflection.officer.employeeCode}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
