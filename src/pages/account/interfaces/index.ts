export interface AccountRequest {
  phoneNumber: string;
  fullName: string;
  email?: string;
  password?: string;
  roleCode?: string;
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
  resident?: {
    id: number;
    residentCode?: string;
  };
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