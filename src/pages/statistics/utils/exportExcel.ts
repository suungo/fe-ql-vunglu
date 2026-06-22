import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  ReflectionStatus,
  Category,
  Priority,
  EventType,
} from "@/pages/reflection/enum";

interface ExportExcelParams {
  filteredStatsReflections: any[];
  categoryData: any[];
  priorityData: any[];
  eventTypeData: any[];
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
}

export const handleExportExcel = ({
  filteredStatsReflections,
  categoryData,
  priorityData,
  eventTypeData,
  dateRange,
}: ExportExcelParams) => {
  if (filteredStatsReflections.length === 0) return;

  const summaryData = [
    { "Chỉ số": "Tổng phản ánh", "Giá trị": filteredStatsReflections.length },
    {
      "Chỉ số": "Chờ xác minh (PENDING)",
      "Giá trị": filteredStatsReflections.filter(
        (r) => r.status === ReflectionStatus.PENDING,
      ).length,
    },
    {
      "Chỉ số": "Đã xác minh (VERIFIED)",
      "Giá trị": filteredStatsReflections.filter(
        (r) => r.status === ReflectionStatus.VERIFIED,
      ).length,
    },
    {
      "Chỉ số": "Đã phân công (ASSIGNED)",
      "Giá trị": filteredStatsReflections.filter(
        (r) => r.status === ReflectionStatus.ASSIGNED,
      ).length,
    },
    {
      "Chỉ số": "Đang xử lý (IN_PROGRESS)",
      "Giá trị": filteredStatsReflections.filter(
        (r) => r.status === ReflectionStatus.IN_PROGRESS,
      ).length,
    },
    {
      "Chỉ số": "Chờ xác nhận (COMPLETED)",
      "Giá trị": filteredStatsReflections.filter(
        (r) => r.status === ReflectionStatus.COMPLETED,
      ).length,
    },
    {
      "Chỉ số": "Hoàn thành (RESOLVED)",
      "Giá trị": filteredStatsReflections.filter(
        (r) => r.status === ReflectionStatus.RESOLVED,
      ).length,
    },
    {
      "Chỉ số": "Từ chối (REJECTED)",
      "Giá trị": filteredStatsReflections.filter(
        (r) => r.status === ReflectionStatus.REJECTED,
      ).length,
    },
  ];

  const categorySummary = categoryData.map((item) => ({
    "Danh mục": item.name,
    "Số lượng": item.value,
  }));
  const prioritySummary = priorityData.map((item) => ({
    "Mức độ": item.name,
    "Số lượng": item.value,
  }));
  const eventTypeSummary = eventTypeData.map((item) => ({
    "Loại sự cố": item.name,
    "Số lượng": item.count,
  }));

  const getStatusText = (status: string) => {
    switch (status) {
      case ReflectionStatus.PENDING:
        return "Chờ xác minh";
      case ReflectionStatus.VERIFIED:
        return "Đã xác minh";
      case ReflectionStatus.ASSIGNED:
        return "Đã phân công";
      case ReflectionStatus.IN_PROGRESS:
        return "Đang xử lý";
      case ReflectionStatus.COMPLETED:
        return "Chờ xác nhận";
      case ReflectionStatus.RESOLVED:
        return "Hoàn thành";
      case ReflectionStatus.REJECTED:
        return "Từ chối";
      default:
        return status;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case Category.INFRASTRUCTURE:
        return "Hạ tầng";
      case Category.ENVIRONMENT:
        return "Môi trường";
      case Category.SECURITY:
        return "An ninh";
      case Category.OTHER:
        return "Khác";
      default:
        return category;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case Priority.LOW:
        return "Thấp";
      case Priority.MEDIUM:
        return "Trung bình";
      case Priority.HIGH:
        return "Cao";
      default:
        return priority;
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case EventType.RAIN:
        return "Mưa lớn";
      case EventType.TIDE:
        return "Triều cường";
      case EventType.FLOOD:
        return "Lũ lụt";
      case EventType.DYKE_BREAK:
        return "Vỡ đê";
      case EventType.LANDSLIDE:
        return "Sạt lở";
      case EventType.OTHER:
        return "Khác";
      default:
        return type;
    }
  };

  const detailedData = filteredStatsReflections.map((r, idx) => ({
    STT: idx + 1,
    "Mã phản ánh": r.id,
    "Tiêu đề": r.title,
    "Nội dung": r.content,
    "Danh mục": getCategoryText(r.category),
    "Loại sự cố": getEventTypeText(r.typeOfIncident),
    "Mức độ ưu tiên": getPriorityText(r.priority),
    "Trạng thái": getStatusText(r.status),
    "Địa chỉ": r.address,
    "Vĩ độ": r.lat,
    "Kinh độ": r.lng,
    "Người gửi": r.user?.fullName || r.user?.username || "Ẩn danh",
    "Thời gian gửi": dayjs(r.createdAt).format("DD/MM/YYYY HH:mm:ss"),
    "Nội dung phản hồi": r.response || "",
    "Thời gian xử lý": r.respondedAt
      ? dayjs(r.respondedAt).format("DD/MM/YYYY HH:mm:ss")
      : "",
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan");
  const wsCategory = XLSX.utils.json_to_sheet(categorySummary);
  XLSX.utils.book_append_sheet(wb, wsCategory, "Theo Danh mục");
  const wsPriority = XLSX.utils.json_to_sheet(prioritySummary);
  XLSX.utils.book_append_sheet(wb, wsPriority, "Theo Mức độ");
  const wsEventType = XLSX.utils.json_to_sheet(eventTypeSummary);
  XLSX.utils.book_append_sheet(wb, wsEventType, "Theo Loại sự cố");
  const wsDetails = XLSX.utils.json_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(wb, wsDetails, "Danh sách chi tiết");

  const dateStr =
    dateRange && dateRange[0] && dateRange[1]
      ? `${dateRange[0].format("YYYYMMDD")}_to_${dateRange[1].format("YYYYMMDD")}`
      : dayjs().format("YYYYMMDD");

  XLSX.writeFile(wb, `BaoCao_ThongKe_SuCo_${dateStr}.xlsx`);
};
