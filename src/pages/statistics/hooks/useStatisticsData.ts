import { useMemo } from "react";
import dayjs from "dayjs";
import {
  ReflectionStatus,
  Category,
  Priority,
  EventType,
} from "@/pages/reflection/enum";
import type { Reflection } from "@/pages/reflection/interfaces";

export const useStatisticsData = (
  allReflections: Reflection[],
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
) => {
  const filteredStatsReflections = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return allReflections;
    }
    const start = dateRange[0].startOf("day");
    const end = dateRange[1].endOf("day");

    return allReflections.filter((r) => {
      const createdTime = dayjs(r.createdAt);
      return createdTime.isAfter(start) && createdTime.isBefore(end);
    });
  }, [allReflections, dateRange]);

  const statsData = useMemo(() => {
    const total = filteredStatsReflections.length;
    const pending = filteredStatsReflections.filter(
      (r) => r.status === ReflectionStatus.PENDING,
    ).length;
    const verified = filteredStatsReflections.filter(
      (r) => r.status === ReflectionStatus.VERIFIED,
    ).length;
    const assigned = filteredStatsReflections.filter(
      (r) => r.status === ReflectionStatus.ASSIGNED,
    ).length;
    const inProgress = filteredStatsReflections.filter(
      (r) => r.status === ReflectionStatus.IN_PROGRESS,
    ).length;
    const completed = filteredStatsReflections.filter(
      (r) => r.status === ReflectionStatus.COMPLETED,
    ).length;
    const resolved = filteredStatsReflections.filter(
      (r) => r.status === ReflectionStatus.RESOLVED,
    ).length;
    const rejected = filteredStatsReflections.filter(
      (r) => r.status === ReflectionStatus.REJECTED,
    ).length;

    const result = [
      { name: "Chờ xác minh", count: pending, color: "#f59e0b" },
      { name: "Đã xác minh", count: verified, color: "#6366f1" },
      { name: "Đã phân công", count: assigned, color: "#8b5cf6" },
      { name: "Đang xử lý", count: inProgress, color: "#0ea5e9" },
      { name: "Chờ xác nhận", count: completed, color: "#14b8a6" },
      { name: "Hoàn thành", count: resolved, color: "#10b981" },
      { name: "Từ chối", count: rejected, color: "#ef4444" },
    ];

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isManager = user?.role?.roleCode === "MANAGER";

    if (isManager) {
      return result.filter(item => 
        item.name !== "Chờ xác minh" && 
        item.name !== "Đã xác minh" && 
        item.name !== "Chờ xác nhận"
      );
    }

    return result;
  }, [filteredStatsReflections]);

  const categoryData = useMemo(() => {
    const counts = {
      [Category.INFRASTRUCTURE]: 0,
      [Category.ENVIRONMENT]: 0,
      [Category.SECURITY]: 0,
      [Category.OTHER]: 0,
    };
    filteredStatsReflections.forEach((r) => {
      if (r.category && counts[r.category] !== undefined) {
        counts[r.category]++;
      }
    });
    return [
      {
        name: "Hạ tầng",
        value: counts[Category.INFRASTRUCTURE],
        color: "#3b82f6",
      },
      {
        name: "Môi trường",
        value: counts[Category.ENVIRONMENT],
        color: "#10b981",
      },
      { name: "An ninh", value: counts[Category.SECURITY], color: "#f59e0b" },
      { name: "Khác", value: counts[Category.OTHER], color: "#64748b" },
    ].filter((item) => item.value > 0);
  }, [filteredStatsReflections]);

  const priorityData = useMemo(() => {
    const counts = {
      [Priority.LOW]: 0,
      [Priority.MEDIUM]: 0,
      [Priority.HIGH]: 0,
    };
    filteredStatsReflections.forEach((r) => {
      if (r.priority && counts[r.priority] !== undefined) {
        counts[r.priority]++;
      }
    });
    return [
      { name: "Thấp", value: counts[Priority.LOW], color: "#22c55e" },
      { name: "Trung bình", value: counts[Priority.MEDIUM], color: "#eab308" },
      { name: "Cao", value: counts[Priority.HIGH], color: "#ef4444" },
    ].filter((item) => item.value > 0);
  }, [filteredStatsReflections]);

  const eventTypeData = useMemo(() => {
    const counts = {
      [EventType.RAIN]: 0,
      [EventType.TIDE]: 0,
      [EventType.FLOOD]: 0,
      [EventType.DYKE_BREAK]: 0,
      [EventType.LANDSLIDE]: 0,
      [EventType.OTHER]: 0,
    };
    filteredStatsReflections.forEach((r) => {
      if (r.typeOfIncident && counts[r.typeOfIncident] !== undefined) {
        counts[r.typeOfIncident]++;
      }
    });
    return [
      { name: "Mưa lớn", count: counts[EventType.RAIN], color: "#3b82f6" },
      { name: "Triều cường", count: counts[EventType.TIDE], color: "#06b6d4" },
      { name: "Lũ lụt", count: counts[EventType.FLOOD], color: "#6366f1" },
      { name: "Vỡ đê", count: counts[EventType.DYKE_BREAK], color: "#d97706" },
      { name: "Sạt lở", count: counts[EventType.LANDSLIDE], color: "#b45309" },
      { name: "Khác", count: counts[EventType.OTHER], color: "#64748b" },
    ];
  }, [filteredStatsReflections]);

  return {
    filteredStatsReflections,
    statsData,
    categoryData,
    priorityData,
    eventTypeData,
  };
};
