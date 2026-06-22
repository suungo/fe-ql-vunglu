import {
  Card,
  Spin,
  Statistic,
  Empty,
  DatePicker,
  Typography,
  Tag,
  Button,
} from "antd";
import {
  CloudRain,
  TrendingUp,
  Droplets,
  Wind,
  Eye,
  RefreshCw,
  AlertTriangle,
  Sun,
  Cloud,
} from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BASE_URL } from "@/apis";
import dayjs from "dayjs";
import { ReflectionStatus } from "../../reflection/enum";
import type { Reflection } from "../../reflection/interfaces";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Tọa độ phường Tam Bình, TP Thủ Đức
const LAT = 10.865;
const LON = 106.731;
const OWM_API_KEY = "bd5e378503939ddaee76f12ad7a97608";

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  description: string;
  rainLastHour: number; // mm
  rain3h: number; // mm
  condition: string;
  rainProbability?: number;
}

export default function Dashboard() {
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >([dayjs(), dayjs()]);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1. Tải dữ liệu phản ánh sự cố cho thống kê
  useEffect(() => {
    setIsStatsLoading(true);
    BASE_URL.get("/reports", {
      params: { limit: 1000 },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((res) => {
        setAllReflections(res.data?.data || res.data || []);
      })
      .catch((err) => console.error("Lỗi khi tải dữ liệu thống kê:", err))
      .finally(() => setIsStatsLoading(false));
  }, []);

  // 2. Fetch dữ liệu thời tiết thời gian thực
  const fetchWeather = useCallback(async () => {
    setLoadingWeather(true);
    setWeatherError(false);
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OWM_API_KEY}&units=metric&lang=vi`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather fetch failed");
      const data = await res.json();

      // Fetch forecast for probability of precipitation (pop)
      let rainProbability = 0;
      try {
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${OWM_API_KEY}&units=metric&lang=vi`;
        const forecastRes = await fetch(forecastUrl);
        if (forecastRes.ok) {
          const forecastData = await forecastRes.json();
          // pop represents probability of precipitation from 0.0 to 1.0 (e.g. 0.85 -> 85%)
          rainProbability = Math.round(
            (forecastData.list?.[0]?.pop ?? 0) * 100,
          );
        }
      } catch (err) {
        console.error("Forecast fetch error:", err);
      }

      setWeather({
        temp: Math.round(data.main?.temp ?? 30),
        feelsLike: Math.round(data.main?.feels_like ?? 32),
        humidity: data.main?.humidity ?? 80,
        windSpeed: Math.round((data.wind?.speed ?? 2) * 3.6), // m/s -> km/h
        visibility: Math.round((data.visibility ?? 10000) / 1000), // m -> km
        description: data.weather?.[0]?.description ?? "không rõ",
        rainLastHour: data.rain?.["1h"] ?? 0,
        rain3h: data.rain?.["3h"] ?? 0,
        condition: data.weather?.[0]?.main ?? "Clear",
        rainProbability,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Weather fetch error:", err);
      setWeatherError(true);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Làm mới mỗi 10 phút
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Lấy nhãn cường độ mưa
  const getRainIntensityLabel = (mm: number) => {
    if (mm === 0)
      return {
        label: "Không mưa",
        color: "text-emerald-500",
        bg: "bg-emerald-50 border-emerald-200",
      };
    if (mm < 2.5)
      return {
        label: "Mưa nhỏ",
        color: "text-blue-500",
        bg: "bg-blue-50 border-blue-200",
      };
    if (mm < 7.5)
      return {
        label: "Mưa vừa",
        color: "text-indigo-500",
        bg: "bg-indigo-50 border-indigo-200",
      };
    if (mm < 15)
      return {
        label: "Mưa to",
        color: "text-amber-500",
        bg: "bg-amber-50 border-amber-200",
      };
    return {
      label: "Mưa rất to",
      color: "text-rose-500",
      bg: "bg-rose-50 border-rose-200",
    };
  };

  const weatherIcon = useMemo(() => {
    if (!weather) return <Sun size={48} className="text-amber-500" />;
    const cond = weather.condition.toLowerCase();
    if (cond.includes("rain") || cond.includes("drizzle")) {
      return <CloudRain size={48} className="text-blue-500 animate-bounce" />;
    }
    if (cond.includes("cloud")) {
      return <Cloud size={48} className="text-slate-400" />;
    }
    return <Sun size={48} className="text-amber-500 animate-pulse" />;
  }, [weather]);

  const filteredStatsReflections = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return allReflections;
    }
    const start = dateRange[0].startOf("day");
    const end = dateRange[1].endOf("day");

    return allReflections.filter((r) => {
      if (!r.createdAt) return false;
      const createdTime = dayjs(r.createdAt);
      // So sánh bao gồm (inclusive) cả ngày bắt đầu và ngày kết thúc
      return !createdTime.isBefore(start) && !createdTime.isAfter(end);
    });
  }, [allReflections, dateRange]);

  const stats = useMemo(() => {
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

    return {
      total: filteredStatsReflections.length,
      pending,
      verified,
      assigned,
      inProgress,
      completed,
      resolved,
      rejected,
    };
  }, [filteredStatsReflections]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleCode = user?.role?.roleCode;
  const isOfficer = roleCode === "OFFICER";
  const isResident = roleCode === "RESIDENT";
  const isPatrol = roleCode === "PATROL";
  const isManager = roleCode === "MANAGER";
  const isMedicalStaff = roleCode === "STAFF";
  const isElectricityStaff =
    user?.humanResource?.position === "ELECTRICITYSTAFF" ||
    (roleCode === "PATROL" &&
      stats &&
      stats.assigned === undefined &&
      stats.inProgress !== undefined);
  const isMedicalOrElectricityStaff = isMedicalStaff || isElectricityStaff;

  const totalReflections = useMemo(() => {
    if (isResident) {
      return stats.total || 0;
    }
    if (isOfficer) {
      return stats.pending || 0;
    }
    if (isManager) {
      return (
        (stats.verified || 0) +
        (stats.assigned || 0) +
        (stats.inProgress || 0) +
        (stats.completed || 0) +
        (stats.resolved || 0) +
        (stats.rejected || 0)
      );
    }
    if (isPatrol) {
      return (
        (stats.assigned || 0) +
        (stats.inProgress || 0) +
        (stats.completed || 0) +
        (stats.resolved || 0)
      );
    }
    if (isMedicalOrElectricityStaff) {
      return (stats.inProgress || 0) + (stats.resolved || 0);
    }
    return stats.total || 0;
  }, [
    stats,
    isResident,
    isOfficer,
    isManager,
    isPatrol,
    isMedicalOrElectricityStaff,
  ]);

  const statsData = useMemo(() => {
    if (isMedicalOrElectricityStaff) {
      return [
        { name: "Đang xử lý", count: stats.inProgress || 0, color: "#0ea5e9" },
        { name: "Hoàn thành", count: stats.resolved || 0, color: "#10b981" },
      ];
    }

    if (isOfficer) {
      return [
        { name: "Chờ xác minh", count: stats.pending || 0, color: "#f59e0b" },
        { name: "Đã xác minh", count: stats.verified || 0, color: "#6366f1" },
        { name: "Từ chối", count: stats.rejected || 0, color: "#ef4444" },
      ];
    }

    if (isResident) {
      return [
        { name: "Chờ xác minh", count: stats.pending || 0, color: "#f59e0b" },
        { name: "Đã xác minh", count: stats.verified || 0, color: "#6366f1" },
        { name: "Đang xử lý", count: stats.inProgress || 0, color: "#0ea5e9" },
        { name: "Hoàn thành", count: stats.resolved || 0, color: "#10b981" },
        { name: "Từ chối", count: stats.rejected || 0, color: "#ef4444" },
      ];
    }

    if (isPatrol) {
      return [
        { name: "Đã phân công", count: stats.assigned || 0, color: "#8b5cf6" },
        { name: "Đang xử lý", count: stats.inProgress || 0, color: "#0ea5e9" },
        { name: "Chờ xác nhận", count: stats.completed || 0, color: "#0891b2" },
        { name: "Hoàn thành", count: stats.resolved || 0, color: "#10b981" },
      ];
    }

    if (isManager) {
      return [
        { name: "Đã phân công", count: stats.assigned || 0, color: "#8b5cf6" },
        { name: "Đang xử lý", count: stats.inProgress || 0, color: "#0ea5e9" },
        { name: "Hoàn thành", count: stats.resolved || 0, color: "#10b981" },
        { name: "Từ chối", count: stats.rejected || 0, color: "#ef4444" },
      ];
    }

    return [
      { name: "Chờ xác minh", count: stats.pending || 0, color: "#f59e0b" },
      { name: "Đã xác minh", count: stats.verified || 0, color: "#6366f1" },
      { name: "Đã phân công", count: stats.assigned || 0, color: "#8b5cf6" },
      { name: "Đang xử lý", count: stats.inProgress || 0, color: "#0ea5e9" },
      { name: "Chờ xác nhận", count: stats.completed || 0, color: "#0891b2" },
      { name: "Hoàn thành", count: stats.resolved || 0, color: "#10b981" },
      { name: "Từ chối", count: stats.rejected || 0, color: "#ef4444" },
    ];
  }, [
    stats,
    isOfficer,
    isResident,
    isPatrol,
    isManager,
    isMedicalOrElectricityStaff,
  ]);

  return (
    <div
      className={`space-y-6  bg-[#FFFFFF] rounded-lg shadow-sm ${isMobile ? "" : "p-4"}`}
    >
      {/* Header */}
      {!isMobile ? (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="m-0! text-slate-800 2xl:text-[22px] xl:text-[20px] text-[18px] font-bold">
              Thông tin tổng hợp - Dashboard
            </h1>
          </div>
        </div>
      ) : (
        <></>
      )}

      <div
        className={
          isMobile
            ? "max-w-3xl mx-auto"
            : "grid grid-cols-1 lg:grid-cols-3 gap-6"
        }
      >
        {/* CỘT THỐNG KÊ (Chiếm 2/3) - Ẩn trên thiết bị di động */}
        {!isMobile && (
          <div className="lg:col-span-2 space-y-6">
            <Card
              title={
                <div className="flex items-center gap-2 text-slate-800">
                  <span>Thống kê tình hình xử lý sự cố đô thị</span>
                </div>
              }
              extra={
                <RangePicker
                  format={"DD/MM/YYYY"}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  placeholder={["Từ ngày", "Đến ngày"]}
                  style={{ width: 350 }}
                  allowClear
                />
              }
              className="shadow-sm rounded-2xl border border-slate-100 bg-white"
            >
              {isStatsLoading ? (
                <div className="flex justify-center py-20">
                  <Spin size="large" tip="Đang tải dữ liệu thống kê..." />
                </div>
              ) : totalReflections === 0 ? (
                <Empty description="Không có dữ liệu thống kê trong khoảng thời gian này" />
              ) : (
                <div className="space-y-6">
                  {/* Statistics Grid */}
                  <div
                    className={`grid grid-cols-2 md:grid-cols-4 ${
                      isMedicalOrElectricityStaff
                        ? "lg:grid-cols-3"
                        : isOfficer
                          ? "lg:grid-cols-4"
                          : isResident
                            ? "lg:grid-cols-6"
                            : isPatrol
                              ? "lg:grid-cols-5"
                              : isManager
                                ? "lg:grid-cols-5"
                                : "lg:grid-cols-8"
                    } gap-4`}
                  >
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                      <Statistic
                        title="Tổng phản ánh"
                        value={totalReflections}
                        valueStyle={{ color: "#2563eb", fontWeight: "bold" }}
                      />
                    </div>

                    {/* Chờ xác minh (Ẩn với PATROL, MANAGER và nhân viên y tế / điện lực) */}
                    {!isPatrol &&
                      !isManager &&
                      !isMedicalOrElectricityStaff && (
                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                          <Statistic
                            title="Chờ xác minh"
                            value={stats.pending || 0}
                            valueStyle={{
                              color: "#d97706",
                              fontWeight: "bold",
                            }}
                          />
                        </div>
                      )}

                    {/* Đã xác minh (Ẩn với PATROL, MANAGER và nhân viên y tế / điện lực) */}
                    {!isPatrol &&
                      !isManager &&
                      !isMedicalOrElectricityStaff && (
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                          <Statistic
                            title="Đã xác minh"
                            value={stats.verified || 0}
                            valueStyle={{
                              color: "#4f46e5",
                              fontWeight: "bold",
                            }}
                          />
                        </div>
                      )}

                    {/* Đã phân công (Ẩn với OFFICER, RESIDENT, và nhân viên y tế / điện lực) */}
                    {!isOfficer &&
                      !isResident &&
                      !isMedicalOrElectricityStaff && (
                        <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100/50">
                          <Statistic
                            title="Đã phân công"
                            value={stats.assigned || 0}
                            valueStyle={{
                              color: "#7c3aed",
                              fontWeight: "bold",
                            }}
                          />
                        </div>
                      )}

                    {/* Đang xử lý (Ẩn với OFFICER) */}
                    {!isOfficer && (
                      <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/50">
                        <Statistic
                          title="Đang xử lý"
                          value={stats.inProgress || 0}
                          valueStyle={{ color: "#0284c7", fontWeight: "bold" }}
                        />
                      </div>
                    )}

                    {/* Chờ xác nhận (Ẩn với OFFICER, RESIDENT, MANAGER, và nhân viên y tế / điện lực) */}
                    {!isOfficer &&
                      !isResident &&
                      !isManager &&
                      !isMedicalOrElectricityStaff && (
                        <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100/50">
                          <Statistic
                            title="Chờ xác nhận"
                            value={stats.completed || 0}
                            valueStyle={{
                              color: "#0891b2",
                              fontWeight: "bold",
                            }}
                          />
                        </div>
                      )}

                    {/* Đã hoàn thành (Ẩn với OFFICER) */}
                    {!isOfficer && (
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                        <Statistic
                          title="Đã hoàn thành"
                          value={stats.resolved || 0}
                          valueStyle={{ color: "#059669", fontWeight: "bold" }}
                        />
                      </div>
                    )}

                    {/* Từ chối (Ẩn với PATROL và nhân viên y tế / điện lực) */}
                    {!isPatrol && !isMedicalOrElectricityStaff && (
                      <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50">
                        <Statistic
                          title="Từ chối"
                          value={stats.rejected || 0}
                          valueStyle={{ color: "#ef4444", fontWeight: "bold" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Column Bar Chart */}
                  <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statsData}
                        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <RechartsTooltip
                          cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #f1f5f9",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          name="Số lượng"
                          radius={[6, 6, 0, 0]}
                          barSize={32}
                        >
                          {statsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* DỮ LIỆU MƯA REAL-TIME (Chiếm 1/3 hoặc toàn bộ chiều rộng) */}
        <div>
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-slate-800">
                  Mưa và Thời tiết thực tế
                </span>
                <Button
                  type="text"
                  shape="circle"
                  onClick={fetchWeather}
                  disabled={loadingWeather}
                  icon={
                    <RefreshCw
                      size={14}
                      className={loadingWeather ? "animate-spin" : ""}
                    />
                  }
                />
              </div>
            }
            className="shadow-sm rounded-2xl border border-slate-100 bg-white h-full"
          >
            {loadingWeather ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Spin size="large" />
                <Text className="text-slate-400 text-xs">
                  Đang lấy dữ liệu thời tiết...
                </Text>
              </div>
            ) : weatherError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <AlertTriangle size={36} className="text-amber-500" />
                <Text className="text-slate-600 font-medium">
                  Không thể kết nối API thời tiết
                </Text>
                <Button type="primary" onClick={fetchWeather}>
                  Thử lại
                </Button>
              </div>
            ) : weather ? (
              <div className="space-y-6">
                {/* Weather primary display */}
                <div className="flex items-center justify-between bg-linear-to-r from-blue-500/5 to-indigo-500/5 p-4 rounded-2xl border border-slate-50">
                  <div>
                    <h3 className="text-4xl font-extrabold text-slate-800 m-0">
                      {weather.temp}°C
                    </h3>
                    <p className="text-sm font-semibold text-slate-600 capitalize mt-1 mb-0">
                      {weather.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 mb-0">
                      Cảm giác như {weather.feelsLike}°C
                    </p>
                  </div>
                  <div>{weatherIcon}</div>
                </div>

                {/* Rain highlight state */}
                {(() => {
                  const rain = weather.rainLastHour || weather.rain3h / 3 || 0;
                  const intensity = getRainIntensityLabel(rain);
                  return (
                    <div
                      className={`p-4 rounded-xl border flex flex-col gap-3 ${intensity.bg}`}
                    >
                      <div className="flex items-center gap-3">
                        <CloudRain className={intensity.color} size={24} />
                        <div>
                          <div
                            className={`font-bold text-sm ${intensity.color}`}
                          >
                            Tình trạng: {intensity.label}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Trạm cảnh báo mưa Phường Tam Bình, Thủ Đức
                          </div>
                        </div>
                      </div>
                      {weather.rainProbability !== undefined && (
                        <div className="flex items-center justify-between text-xs border-t border-dashed border-slate-200/60 pt-2 mt-1">
                          <span className="text-slate-500 font-medium">
                            Khả năng có mưa (3h tới):
                          </span>
                          <span className="font-bold text-slate-700 bg-white/60 px-2.5 py-0.5 rounded-full border border-slate-100">
                            {weather.rainProbability}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Rain volume stats */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    Lượng mưa ghi nhận
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {weather.rainLastHour.toFixed(1)} mm
                      </div>
                      <div className="text-[10px] text-blue-400 font-semibold mt-1">
                        1 giờ qua
                      </div>
                    </div>
                    <div className="bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-indigo-600">
                        {weather.rain3h.toFixed(1)} mm
                      </div>
                      <div className="text-[10px] text-indigo-400 font-semibold mt-1">
                        3 giờ qua
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auxiliary conditions */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Droplets size={16} className="text-blue-500 mb-1" />
                    <div className="text-xs font-bold text-slate-800">
                      {weather.humidity}%
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Độ ẩm
                    </div>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Wind size={16} className="text-cyan-500 mb-1" />
                    <div className="text-xs font-bold text-slate-800">
                      {weather.windSpeed} km/h
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Tốc độ gió
                    </div>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Eye size={16} className="text-emerald-500 mb-1" />
                    <div className="text-xs font-bold text-slate-800">
                      {weather.visibility} km
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Tầm nhìn
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  {lastUpdated &&
                    `Cập nhật lúc: ${lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" })}`}
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
