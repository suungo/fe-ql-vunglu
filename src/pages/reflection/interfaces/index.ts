import type { Category, EventType, Priority, ReflectionStatus } from "../enum";

export interface Reflection {
  id: number;

  title: string;
  content: string;
  category: Category;
  description: string;
  lat: number;
  lng: number;
  address: string;
  imageUrl: string[];
  status: ReflectionStatus;
  priority: Priority;
  typeOfIncident: EventType;
  createdAt: string;
  updatedAt: string;
  response?: string;
  respondedAt?: string;
  user?: {
    fullName?: string;
    username?: string;
    role?: { roleCode?: string };
  };

  // ── Workflow fields ──────────────────────────────────
  officerId?: number;
  inspectorId?: number;
  patrolId?: number;
  rejectReason?: string;
  patrolReport?: string;
  needReinforcement?: boolean;
  estimatedHandleMinutes?: number;
  patrolLat?: number;
  patrolLng?: number;
  verifiedAt?: string;
  dispatchedAt?: string;
  assignedAt?: string;
  inspectorAcceptedAt?: string;
  patrolAcceptedAt?: string;
  managedBy?: number;
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