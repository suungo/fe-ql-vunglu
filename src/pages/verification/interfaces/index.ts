export enum VerificationStatus {
  PENDING = 'PENDING', // Chờ xử lý
  APPROVED = 'APPROVED', // Đã duyệt
  REJECTED = 'REJECTED', // Đã từ chối
  COMPLETED = 'COMPLETED', // Đã hoàn thành
}

export enum VerificationType {
  RESIDENT_REGISTRATION = 'RESIDENT_REGISTRATION',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  TEMPORARY_RESIDENT = 'TEMPORARY_RESIDENT',
  REFLECTION = 'REFLECTION',
  OTHER = 'OTHER',
}

export interface Verification {
  id: number;
  code: string;
  title: string;
  description: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: number;
  user_id: number;
  user?: {
    id: number;
    fullName: string;
    phoneNumber: string;
  };
  attachments?: string[];
  referenceId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVerification {
  status: VerificationStatus;
  reviewNote?: string;
}
