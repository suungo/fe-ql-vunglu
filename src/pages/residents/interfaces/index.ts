import type { IFloodDamage } from "@/pages/floodDamages/interfaces";
import type { HasBusiness, HasChildren, HasElderly, HasPregnant, HasSick, HouseType } from "../enum";

export interface Resident {
  id: number; // Mã dân cư
  residentCode: string; // Mã dân cư

  fullName: string; // Tên chủ hộ
  phoneNumber: string; // Số điện thoại
  email: string; // Email
  address: string; // Địa chỉ
  latitude: number; // Vĩ độ
  longitude: number; // Kinh độ

  numberOfMembers: number; // Số thành viên trong hộ

  hasElderly: HasElderly; // Có người già
  hasChildren: HasChildren; // Có trẻ em
  hasPregnantWomen: HasPregnant; // Có phụ nữ mang thai
  hasChronicDisease: HasSick; // Có người bị bệnh nền

  houseType: HouseType; // Loại nhà
  numberOfFloors: number; // Số tầng      

  hasBusiness: HasBusiness; // Có kinh doanh

  floodDamages?: IFloodDamage[]; // Danh sách thiệt hại

  reflections?: any[]; // Danh sách phản ánh
  userId?: number;
  user?: {
    id: number;
    fullName: string;
    phoneNumber: string;
    email?: string;
    role?: {
      roleCode: string;
      roleName: string;
    };
  };

  createdAt: Date; // Ngày tạo
  cccd?: string; // Số CCCD
}

export interface CreateResident {
  residentCode: string; // Mã dân cư

  fullName: string; // Tên chủ hộ
  phoneNumber: string; // Số điện thoại
  email: string; // Email
  address: string; // Địa chỉ
  latitude: number; // Vĩ độ
  longitude: number; // Kinh độ

  numberOfMembers: number; // Số thành viên trong hộ

  hasElderly: boolean; // Có người già
  hasChildren: boolean; // Có trẻ em
  hasPregnantWomen: boolean; // Có phụ nữ mang thai
  hasChronicDisease: boolean; // Có người bị bệnh nền

  houseType: HouseType; // Loại nhà
  numberOfFloors: number; // Số tầng      

  hasBusiness: boolean; // Có kinh doanh

  userId?: number;
  createAccount?: boolean;
  cccd?: string; // Số CCCD
}

export type UpdateResident = CreateResident;