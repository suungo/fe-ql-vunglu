import React from "react";

// Kiểm tra dữ liệu tìm kiếm có phải đường link không
export const isValidURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const handleOnChangeText = (
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  const value = e.currentTarget.value;
  const isBackspace = e.key === "Backspace";

  if (isValidURL(value) && !isBackspace) {
    e.preventDefault();
  }
};
// Chỉ cho phép người dùng nhập số và sẽ không thể nhập chữ hoặc kí tự đặc biệt
export const handleNoEnterCharactor = (
  e: React.KeyboardEvent<HTMLInputElement>,
) => {
  const { key, ctrlKey, metaKey } = e;

  // Cho phép các tổ hợp phím hệ thống (Ctrl/Command)
  if (ctrlKey || metaKey) return;

  const allowedKeys = [
    "Backspace",
    "Tab",
    "ArrowLeft",
    "ArrowRight",
    "Delete",
    "Enter",
    "Escape",
  ];

  if (allowedKeys.includes(key)) return;

  // Chấp nhận các phím là chữ số 0-9
  if (/^[0-9]$/.test(key)) return;

  // Chấp nhận dấu chấm (.) hoặc dấu phẩy (,) cho số thập phân
  if (key === "." || key === ",") {
    const value = e.currentTarget.value;
    // Chỉ cho phép nhập 1 dấu thập phân
    if (value.includes(".") || value.includes(",")) {
      e.preventDefault();
    }
    return;
  }

  // Chặn tất cả các phím khác
  e.preventDefault();
};

// Ngăn chặn người dùng cố gắng copy | past dữ liệu là 1 đường link
// Nếu dữ liệu của clipboard là 1 đường link sẽ bị chặn và không thể dán vào ô input được
export const handlePaste = (
  e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  const pastedText = e.clipboardData.getData("Text");
  if (isValidURL(pastedText)) {
    e.preventDefault();
    return;
  }
};

// Chặn các kí tự đặc biệt trong mã sản phẩm chỉ cho phép nhập chữ và số
export const handleSpecialCharProductCode = (
  e: React.KeyboardEvent<HTMLInputElement>,
) => {
  const { key } = e;

  // Cho phép các phím điều hướng và điều khiển
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Enter",
    "Escape",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "Clear",
    "Control",
    "Meta",
    "Alt",
    "Shift",
  ];

  // Nếu là phím điều hướng/điều khiển, cho phép
  if (allowedKeys.includes(key)) {
    return;
  }

  // Nếu là phím chữ hoặc số, cho phép
  if (/^[a-zA-Z0-9]$/.test(key)) {
    return;
  }

  // Chặn tất cả các phím khác (kí tự đặc biệt)
  e.preventDefault();
};

// Kiểm tra người dùng xem email nhập vào có hợp lệ hay không
export function isValidEmail(email: string): boolean {
  const regex =
    /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Kiểm tra định dạng chung
  if (!regex.test(email)) return false;

  const [localPart, domain] = email.split("@");

  // Kiểm tra domain có tồn tại không
  if (!domain) return false;

  // Regex phát hiện ký tự đặc biệt lặp lại từ 2 lần trở lên (ví dụ: --, __, .., ++,...)
  const specialCharRepeatRegex = /([!#$%&'*+/=?^_`{|}~.-])\1+/;

  // Nếu phần trước @ chứa ký tự đặc biệt liên tiếp => lỗi
  if (specialCharRepeatRegex.test(localPart)) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;

  return true;
}

// Kiểm tra người dùng xem số điện thoại nhập vào có hợp lệ hay không
export const phoneRegex =
  /^((1(8|9)00)([0-9]{4}|[0-9]{6})|0(1|3|5|7|8|9)[0-9]{8,15})$/;

// Loại bỏ khoảng trắng ở đầu của cuối của component BaseCKEditor
export const cleanHTMLContent = (html: string): string => {
  return html
    .replace(/&nbsp;/g, " ") // Thay &nbsp; thành khoảng trắng
    .replace(/>\s+</g, "><") // Loại bỏ khoảng trắng giữa các thẻ HTML
    .replace(/\s+/g, " ") // Gom nhiều khoảng trắng thành 1
    .replace(/<p>\s*<\/p>/g, "") // Xóa các thẻ <p> trống
    .trim(); // Loại bỏ khoảng trắng đầu và cuối
};

// Tự động loại bỏ space đầu và cuối cho tất cả các trường text trong object
export const trimAllFields = (
  obj: Record<string, unknown>,
  excludeFields: string[] = [],
): Record<string, unknown> => {
  const trimmedObj = { ...obj };

  Object.keys(trimmedObj).forEach((key) => {
    const value = trimmedObj[key];

    // Chỉ trim các trường string, không phải HTML content và không nằm trong danh sách loại trừ
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      !excludeFields.includes(key)
    ) {
      trimmedObj[key] = value.trim();
    }
  });

  return trimmedObj;
};

// Hàm xử lý paste cho số điện thoại - cho phép paste số
export const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  const pastedText = e.clipboardData.getData("Text");

  // Chỉ chặn nếu là URL, cho phép paste số điện thoại
  if (isValidURL(pastedText)) {
    e.preventDefault();
    return;
  }

  // Cho phép paste nếu chỉ chứa số
  const phoneRegex = /^[\d\s\-+()]+$/;
  if (!phoneRegex.test(pastedText)) {
    e.preventDefault();
    return;
  }
};


