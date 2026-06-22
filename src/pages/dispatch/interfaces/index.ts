export enum DispatchReportStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DispatchReportType {
  MANAGER_TO_INSPECTOR = 'MANAGER_TO_INSPECTOR',
  INSPECTOR_TO_PATROL = 'INSPECTOR_TO_PATROL',
}

export interface DispatchReport {
  id: number;
  code: string;
  type: DispatchReportType;
  status: DispatchReportStatus;
  reflectionId: number;
  assignedBy: number;
  assignedTo?: number;
  customHandler?: string;
  assignedAt: string;
  expiredAt: string;
  acceptedAt?: string;
  completedAt?: string;
  expectedTime?: string;
  title?: string;
  description?: string;
  note?: string;
  reportContent?: string;
  reflectionStatusUpdate?: string;
  attachments?: string[];
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  reflection?: {
    id: number;
    title?: string;
    content: string;
    address?: string;
    status: string;
    imageUrl?: string[];
    lat?: number;
    lng?: number;
    patrolLat?: number;
    patrolLng?: number;
    needReinforcement?: boolean;
    user?: {
      fullName?: string;
      phoneNumber?: string;
    };
  };
  assigner?: {
    id: number;
    fullName?: string;
    phoneNumber?: string;
  };
  assignee?: {
    id: number;
    fullName?: string;
    phoneNumber?: string;
  };
}
