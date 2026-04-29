// Các query chung (meta) trong cho các API tìm kiếm phân trang
export type Meta = {
  search?: string;
  page?: number;
  limit?: number;
  total?: number;
  otalPages?: number;
};

// export type ApiResponse<T = any> = {
//   statusCode: number;
//   message: string;
//   data?: T;
// };

// Kiểu dữ liệu chung cho các API trả về response
export type BaseResponse<T, Extra = unknown> = {
  statusCode?: number;
  message?: string;
  data: T; // Nếu không có data thì truyền void hoặc null
  success?: boolean;
  timestamp?: string;
  error?: string;
} & Extra;

// Kiểu dữ liệu giành cho các API trả về 1 object (Detail, Create, Update)
export type SingleResponse<T, Extra = unknown> = BaseResponse<T, Extra>;

// Kiểu dữ liệu giành cho các API trả về danh sách (List all - không phân trang)
export type ListResponse<T, Extra = unknown> = BaseResponse<T[], Extra>;

// Kiểu dữ liệu giành cho các API có phân trang (data là T[] + meta riêng — legacy pattern)
export type PaginatedResponse<T, Extra = unknown> = BaseResponse<
  T[],
  Extra & {
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
  }
>;

/**
 * Kiểu dữ liệu phân trang chuẩn — khớp với format backend thực tế:
 * { success, statusCode, message, data: { items: T[], totalRecords, currentPage, pageSize, totalPages } }
 */
export type PaginatedData<T> = {
  items: T[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

export type PaginatedDataResponse<T> = BaseResponse<PaginatedData<T>>;

export type PaginatedResponseHistory<T> = PaginatedResponse<
  T,
  {
    entityCreatedAt?: string;
  }
>;
