// Re-export từ types chung
export type {
  ApiResponse, CreateFloodDamageRequest, FloodDamage, FloodDamageFilter,
  FloodDamageStats, UpdateFloodDamageRequest
} from "@/types/flood-damage.types";

// Re-export enums
export { DamageCategory, DamageStatus } from "@/types/flood-damage.types";

// Interfaces cục bộ (nếu cần custom thêm)
import type { DamageCategory, DamageStatus } from "@/types/flood-damage.types";

export interface IFloodDamage {
  id: number; // ID của thiệt hại
  reflectionId: number; // ID của phản ánh
  householdId?: number; // ID của hộ gia đình
  damageCategory: DamageCategory; // Loại thiệt hại
  description: string; // Mô tả thiệt hại
  estimatedValue: number; // Giá trị ước tính
  injuredCount: number; // Số người bị thương
  deathCount: number; // Số người tử vong
  createdAt: string; // Ngày tạo
  updatedAt: string; // Ngày cập nhật
  createdBy: number; // Người tạo
  status: DamageStatus; // Trạng thái
  reflection?: {
    id: number; // ID của phản ánh
    title: string; // Tiêu đề phản ánh
    category: string; // Loại phản ánh
  };
  household?: {
    id: number; // ID của hộ gia đình
    fullName: string; // Tên hộ gia đình
    phoneNumber?: string; // Số điện thoại
  };
  creator?: {
    id: number; // ID của người tạo
    fullName: string; // Tên người tạo
  };
}

export interface IUpdateFloodDamageRequest {
  damageCategory?: DamageCategory;
  description?: string;
  estimatedValue?: number;
  injuredCount?: number;
  deathCount?: number;
  status?: DamageStatus;
  householdId?: number;
}