import dayjs from "dayjs";

/**
 * @description Hàm định dạng thời gian từ giây sang định dạng "phút :
 * @param totalSeconds Tổng số giây cần định dạng
 * @returns Định dạng thời gian dưới dạng chuỗi "phút : giây"
 * @example formatTime(125) // "2 : 05"
 * @author Ngọ Văn Sửu (02/01/2026)
 */
export const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes} : ${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * @description Hàm chuyển đổi tên ngày trong tiếng Anh sang tiếng Việt
 * @param day Tên ngày trong tiếng Anh
 * @returns Tên ngày trong tiếng Việt
 * @example translateWorkDate("MONDAY") // "Thứ 2"
 */
export const translateWorkDate = (day: string) => {
  switch (day) {
    case "MONDAY":
      return "Thứ 2";
    case "TUESDAY":
      return "Thứ 3";
    case "WEDNESDAY":
      return "Thứ 4";
    case "THURSDAY":
      return "Thứ 5";
    case "FRIDAY":
      return "Thứ 6";
    case "SATURDAY":
      return "Thứ 7";
    case "SUNDAY":
      return "Chủ Nhật";
    default:
      return "";
  }
};

/**
 * Định dạng số có phân tách hàng nghìn theo locale (en-US, vi-VN,...)
 * @param value: string | number — giá trị đầu vào
 * @param locale: string — mã ngôn ngữ định dạng (mặc định: 'en-US')
 * @param options: Intl.NumberFormatOptions — tuỳ chọn format nâng cao
 * @returns string — số đã định dạng
 */
export function formatNumberWithLocale(
  value: string | number,
  locale: string = "vi-VN",
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined || value === "") return "";

  const cleaned =
    typeof value === "string"
      ? value.replace(/[^\d.-]/g, "") // Cho phép dấu âm và dấu chấm
      : value;

  const number = parseFloat(cleaned as string);

  if (isNaN(number)) return "";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(number);
}

/**
 * Chuyển đổi số đã định dạng về dạng số nguyên hoặc số thập phân
 * @param formatted: string — chuỗi đã định dạng
 * @param locale: string — mã ngôn ngữ định dạng (mặc định: 'vi-VN')
 * @returns number — số đã chuyển đổi
 */
export function unformatNumberFromLocale(formatted: string, locale = "vi-VN") {
  const groupSeparator = new Intl.NumberFormat(locale)
    .format(1111)
    .replace(/1/g, "");

  const decimalSeparator = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
  })
    .format(1.1)
    .replace(/1/g, "");

  const normalized = formatted
    .replace(new RegExp(`\\${groupSeparator}`, "g"), "")
    .replace(new RegExp(`\\${decimalSeparator}`), ".");

  return parseFloat(normalized);
}

// Format giá trị VAT
export const formatVAT = (value?: string) => {
  const input = (value ?? "").trim();
  if (!input) return "";

  const normalized = input.replace(/,/g, ".").replace(/[^0-9.%]/g, "");
  const cleaned = normalized.replace(/%/g, "");

  const segments = cleaned.split(".");
  const integerPart = segments[0] ?? "";
  const decimalRaw = segments.slice(1).join("");

  if (!integerPart && !decimalRaw) {
    return "";
  }

  const limitedDecimal = decimalRaw.slice(0, 2);
  let numberPart = integerPart;

  if (!integerPart && limitedDecimal) {
    numberPart = `0.${limitedDecimal}`;
  } else if (integerPart && limitedDecimal) {
    numberPart = `${integerPart}.${limitedDecimal}`;
  }

  return `${numberPart}%`;
};

export const parseVAT = (formattedValue: string): number => {
  const numeric = formattedValue.replace(/\D/g, "");
  return Number(numeric);
};

/**
 * @description Chuyển đổi giá trị thành số với định dạng phù hợp
 * @param value Giá trị cần chuyển đổi (có thể đã được format với dấu phân cách)
 * @returns {number} Giá trị đã được định dạng
 * @author Ngọ Văn Sửu (02/01/2026)
 */
export const formatFromDecimalToNumber = (value: string | number): number => {
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? Math.trunc(value)
      : parseFloat(value.toFixed(2));
  }

  // Xử lý string có thể chứa dấu phân cách (1.000.000 hoặc 1,000,000)
  const cleanedValue = String(value).replace(/[.,]/g, "");
  const num = parseFloat(cleanedValue);

  if (isNaN(num)) return 0;

  return Number.isInteger(num) ? Math.trunc(num) : parseFloat(num.toFixed(2));
};

// Hàm format số (chỉ được nhập số và số thập phần có tối đa 2 chữ số sau dấu phẩy)
export const formatNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number(value.toFixed(2)).toString();
  }
  return value.replace(/[^0-9.]/g, "").replace(/(\.\d{2}).*$/, "$1");
};

// Hàm format số có thể nhập số âm
export const formatNumberNegative = (
  value: string | number | null | undefined,
) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number(value.toFixed(2)).toString();
  }
  let formatted = value.replace(/[^0-9.-]/g, "");
  formatted = formatted.replace(/(?!^)-/g, ""); // chỉ giữ dấu âm ở đầu
  formatted = formatted.replace(/(\..*)\./g, "$1"); // chỉ giữ một dấu chấm thập phân
  return formatted.replace(/(\.\d{2}).*$/, "$1");
};

// Hàm format thời gian
export const formatDate = (time: string) => {
  return dayjs(time).format("DD/MM/YYYY HH:mm:ss");
};
