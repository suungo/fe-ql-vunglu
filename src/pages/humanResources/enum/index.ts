export enum HumanResourcesStatus {
  ACTIVE = 'ACTIVE',     // Đang làm việc
  INACTIVE = 'INACTIVE', // Đã dừng làm việc / Nghỉ việc
  PENDING = 'PENDING',   // Chưa làm việc (đang chờ duyệt / onboarding)
}

export enum HumanResourcesPosition {
  OFFICER = "OFFICER", // Cán bộ tăng cường
  STAFF = "STAFF", // Nhân viên y tế
  POSTOFFICER = "POSTOFFICER", // Cán bộ hậu kiểm
  ELECTRICITYSTAFF = "ELECTRICITYSTAFF", // Nhân viên điện lực
  PATROL = "PATROL", // Cán bộ tuần tra
}