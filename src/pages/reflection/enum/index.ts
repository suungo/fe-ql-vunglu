// Loại sự cố   - Đường phố, hẻm, ngõ, cầu cống, cống thoát nước, hệ thống điện, hệ thống thoát nước, hệ thống thoát nước, hệ thống thoát nước, hệ thống thoát nước, hệ thống thoát nước, hệ thống thoát nước, hệ thống thoát nước, hệ thống thoát nước, hệ thống thoát nước
export enum EventType {
  RAIN = "RAIN", // Mưa
  TIDE = "TIDE", // Mực nước
  FLOOD = "FLOOD", // Lũ lụt
  DYKE_BREAK = "DYKE_BREAK", // Vỡ đê
  // sạt lở
  LANDSLIDE = "LANDSLIDE", // Sạt lở
  OTHER = "OTHER", // Loại khác
}

// Mức độ
export enum Priority {
  LOW = "LOW", // Thấp
  MEDIUM = "MEDIUM", // Trung bình
  HIGH = "HIGH", // Cao
}


// Loại danh mục
export enum Category {
  INFRASTRUCTURE = "INFRASTRUCTURE", // Hạ tầng
  ENVIRONMENT = "ENVIRONMENT", // Môi trường
  SECURITY = "SECURITY", // An ninh trật tự
  OTHER = "OTHER", // Loại khác
}


export enum ReflectionStatus {
  PENDING = 'PENDING',       // Chờ xác minh (mới gửi từ người dân)
  VERIFIED = 'VERIFIED',     // Cán bộ tăng cường đã xác minh
  ASSIGNED = 'ASSIGNED',     // Quản lý đã phân công cho Hậu kiểm
  IN_PROGRESS = 'IN_PROGRESS', // Tuần tra đang xử lý hiện trường
  COMPLETED = 'COMPLETED',   // Tuần tra báo cáo xong, chờ Hậu kiểm xác nhận
  RESOLVED = 'RESOLVED',     // Đã hoàn thành toàn bộ
  REJECTED = 'REJECTED',     // Từ chối
}