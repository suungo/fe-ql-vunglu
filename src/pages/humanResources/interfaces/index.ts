import type { BaseFields } from "@/components/interfaces/base-fileds.interface";
import type { Gender } from "@/enums";
import type dayjs from "dayjs";

type DayjsType = ReturnType<typeof dayjs>;

export interface HumanResources extends BaseFields{
  employeeCode: string; // Mã nhân sự
  fullName: string; // Tên nhân sự
  email: string; // Email
  phoneNumber: string; // Số điện thoại
  address: string; // Địa chỉ
  dateBirth: string, // Ngày sinh
  position: string; // Chức vụ
  gender: Gender; // Giới tính
  status: string; // Trạng thái
  notes?: string;
}

export interface CreateHumanResources {
  employeeCode: string; // Mã nhân sự
  fullName: string; // Tên nhân sự
  email: string; // Email
  phoneNumber: string; // Số điện thoại
  dateBirth: string | DayjsType | null; // Ngày sinh
  address: string; // Địa chỉ
  position: string; // Chức vụ
  gender: Gender; // Giới tính
  status: string; // Trạng thái
  notes?: string;
}


export interface UpdateHumanResources extends CreateHumanResources {
}