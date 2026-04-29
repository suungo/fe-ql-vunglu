export enum HumanResourcesStatus {
  ACTIVE = 'ACTIVE',     // Đang làm việc
  INACTIVE = 'INACTIVE', // Đã dừng làm việc / Nghỉ việc
  PENDING = 'PENDING',   // Chưa làm việc (đang chờ duyệt / onboarding)
}

export enum HumanResourcesPosition {
 OFFICER = 'OFFICER',  // Cán bộ phường (công an)
  LEADER = 'LEADER',    // Trưởng/phó khu phố (Tình nguyện viên)
  STAFF = 'STAFF',      // Nhân viên y tế
}