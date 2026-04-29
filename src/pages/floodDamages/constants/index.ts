import { DamageCategory, DamageStatus } from "../enum";

export const categoryOptions = [
  { value: DamageCategory.ECONOMIC, label: "Kinh tế (cây trồng, vật nuôi)" },
  { value: DamageCategory.PROPERTY, label: "Tài sản (nhà cửa, đồ đạc)" },
  { value: DamageCategory.BUSINESS, label: "Kinh doanh" },
  { value: DamageCategory.HEALTH, label: "Sức khỏe" },
  { value: DamageCategory.FATALITY, label: "Thương vong (tử vong)" },
  { value: DamageCategory.OTHER, label: "Khác" },
];

export const statusOptions = [
  { value: DamageStatus.PENDING, label: "Chờ kiểm chứng" },
  { value: DamageStatus.APPROVED, label: "Đã kiểm chứng" },
  { value: DamageStatus.REJECTED, label: "Đang kiểm chứng" },
];
