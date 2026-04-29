import type { Category, EventType, Priority, ReflectionStatus } from "../enum";

export interface Reflection {
  id: number;

  title: string; // Tiêu đề
  content: string; // Nội dung
  category: Category; // Danh mục
  description: string; // Mô tả
  lat: number; // Vĩ độ
  lng: number; // Kinh độ
  address: string; // Địa chỉ
  imageUrl: string[]; // Ảnh
  status: ReflectionStatus; // Trạng thái
  priority: Priority; // Mức độ
  // Loại sự cố
  typeOfIncident: EventType;
  // Thời gian tạo
  createdAt: string;
  // Thời gian cập nhật
  updatedAt: string;
  response?: string;
  respondedAt?: string;
  user?: {
      fullName?: string;
      username?: string;
      role?: {
        roleCode?: string;
      };
  };
}

export interface CreateReflection {
  title: string // Tiêu để
  content: string; // Nội dung
  category: Category; // Danh mục
  description: string; // Mô tả
  lat: number; // Vĩ độ
  lng: number; // Kinh độ
  address: string; // Địa chỉ
  imageUrl: string[]; // Ảnh
  priority: Priority; // Mức độ
  // Loại sự cố
  typeOfIncident: EventType;

}

export interface UpdateReflection extends CreateReflection {
    id: number;
}