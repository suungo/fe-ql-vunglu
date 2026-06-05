export interface RegisterRequest {
  phoneNumber: string;
  fullName: string;
  email: string;
  province: string;
  wards: string;
  address: string;
}

export interface Role {
  id: number;
  roleName: string;
  roleCode: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  status: string;
  avatar?: string;
  createdAt: string;
  role: Role;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}