import { HouseType } from "../enum";

export const HouseTypeLabel: Record<HouseType, string> = {
  [HouseType.HOUSE_LEVEL_4]: "Nhà cấp 4",
  [HouseType.HOUSE_STREET]: "Nhà phố (Nhà ống)",
  [HouseType.HOUSE_ALLEY]: "Nhà trong hẻm",
  [HouseType.HOUSE_FRONTAGE]: "Nhà mặt tiền",
  [HouseType.APARTMENT]: "Chung cư / căn hộ",
  [HouseType.RENTAL_HOUSE]: "Nhà trọ / phòng trọ",
  [HouseType.VILLA]: "Biệt thự / nhà liền kề",
};

