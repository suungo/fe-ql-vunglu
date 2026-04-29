



/**
 * Interface cho giá tiền chuẩn trong response
 */
export interface CurrencyResponse {
  /** Giá trị số (không format) */
  value: number;
  /** Giá trị đã format với đơn vị tiền tệ */
  full: string;
  /** Đơn vị tiền tệ gốc */
  unit: string;
}

/**
 * Format số tiền chỉ với số và dấu phân cách (không có symbol)
 * @param amount Số tiền cần format
 * @param currency Đơn vị tiền tệ
 * @returns Chuỗi số đã format
 */
export function formatCurrencyNumber(
  amount: number | string,
  currency: "VND" | "USD" = "VND",
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
    return "0";
  }

  const isInteger = Number.isInteger(numAmount);

  return numAmount.toLocaleString(currency, {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  });
}

/**
 * Normalizer để dùng trực tiếp trong Form.Item normalize
 * Tự động parse về int và format hiển thị thành chuỗi có phân cách.
 * @param value Dữ liệu người dùng gõ
 * @param currency Đơn vị tiền tệ
 */
export function normalizeCurrency(
  value: string | number | undefined | null,
  currency: "VND" | "USD" = "VND"
): string {
  if (value === null || value === undefined || value === "") return "";

  const num = parseCurrency(String(value), currency);
  if (isNaN(num) || num === 0) return "";

  return formatCurrencyNumber(num, currency);
}

/**
 * Parse chuỗi tiền tệ đã format về số
 * @param formattedValue Chuỗi đã format
 * @param currency Đơn vị tiền tệ
 * @returns Số tiền
 */
export function parseCurrency(
  formattedValue: string,
  currency: "VND" | "USD" = "VND",
): number {
  if (!formattedValue) return 0;

  // Xóa tất cả ký tự không phải số, dấu chấm, dấu phẩy
  const cleaned = formattedValue.replace(/[^\d.,-]/g, "");

  // Xử lý dấu phân cách theo locale
  let normalized = cleaned;

  if (currency === "USD") {
    // USD sử dụng dấu phẩy làm phân cách hàng nghìn
    normalized = cleaned.replace(/,/g, "");
  } else {
    // VND và WON sử dụng dấu chấm làm phân cách hàng nghìn
    normalized = cleaned.replace(/\./g, "");
  }

  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : result;
}
