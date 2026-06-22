export const getReputationLevel = (points: number) => {
  if (points === 10)
    return {
      label: "Xuất sắc",
      color: "#10b981",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      tagColor: "success",
    };
  if (points >= 8)
    return {
      label: "Tốt",
      color: "#3b82f6",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      tagColor: "processing",
    };
  if (points >= 5)
    return {
      label: "Trung bình",
      color: "#f59e0b",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      tagColor: "warning",
    };
  if (points > 0)
    return {
      label: "Cảnh cáo",
      color: "#ef4444",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      tagColor: "error",
    };
  return {
    label: "Tạm khóa",
    color: "#6b7280",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    tagColor: "default",
  };
};

export const getInitials = (name: string) =>
  name
    ?.split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

export const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];
