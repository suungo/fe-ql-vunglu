import { Gender } from "@/enums";
import { HumanResourcesPosition, HumanResourcesStatus } from "../enum";

export const SelectHumanResourcesPosition = [
  {
    value: HumanResourcesPosition.OFFICER,
    label: "Cán bộ tăng cường",
  },
  {
    value: HumanResourcesPosition.STAFF,
    label: "Nhân viên y tế",
  },
  {
    value: HumanResourcesPosition.POSTOFFICER,
    label: "Cán bộ hậu kiểm",
  },
  {
    value: HumanResourcesPosition.ELECTRICITYSTAFF,
    label: "Nhân viên điện lực",
  },
  {
    value: HumanResourcesPosition.PATROL,
    label: "Cán bộ tuần tra",
  },
];

export const SelectHumanResourcesStatus = [
  {
    value: HumanResourcesStatus.ACTIVE,
    label: "Đang làm việc",
  },
  {
    value: HumanResourcesStatus.INACTIVE,
    label: "Dừng làm việc",
  },
  {
    value: HumanResourcesStatus.PENDING,
    label: "Chưa làm việc",
  },
];


// Giới tính
export const SelectGender = [
  {
    value: Gender.MALE,
    label: "Nam",
  },
  {
    value: Gender.FEMALE,
    label: "Nữ",
  },
];