import React from "react";
import { Users, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import type { UserReputation } from "../hook/useReputationData";

interface ReputationStatsProps {
  users: UserReputation[];
  total: number;
}

export default function ReputationStats({ users, total }: ReputationStatsProps) {
  const excellent = users.filter((u) => u.reputationPoints === 10).length;
  const good = users.filter(
    (u) => u.reputationPoints >= 8 && u.reputationPoints < 10,
  ).length;
  const warning = users.filter(
    (u) => u.reputationPoints > 0 && u.reputationPoints < 5,
  ).length;
  const locked = users.filter((u) => u.reputationPoints === 0).length;

  const statCards = [
    {
      label: "Tổng người dùng",
      value: total,
      icon: <Users size={20} />,
      color: "#6366f1",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },
    {
      label: "Xuất sắc / Tốt",
      value: excellent + good,
      icon: <ShieldCheck size={20} />,
      color: "#10b981",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Cảnh cáo",
      value: warning,
      icon: <ShieldAlert size={20} />,
      color: "#f59e0b",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      label: "Tạm khóa",
      value: locked,
      icon: <ShieldOff size={20} />,
      color: "#ef4444",
      bg: "bg-red-50",
      text: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
  );
}
