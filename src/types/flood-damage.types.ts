// Enums
export enum DamageCategory {
  ECONOMIC = 'ECONOMIC',
  PROPERTY = 'PROPERTY',
  BUSINESS = 'BUSINESS',
  HEALTH = 'HEALTH',
  FATALITY = 'FATALITY',
  OTHER = 'OTHER',
}

export enum DamageStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Interfaces
export interface FloodDamage {
  id: number;
  damageCategory: DamageCategory;
  description: string;
  estimatedValue: number;
  injuredCount: number;
  deathCount: number;
  status: DamageStatus;
  reflectionId: number;
  householdId?: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reflection?: {
    id: number;
    title: string;
    category: string;
  };
  household?: {
    id: number;
    fullName: string;
    phoneNumber?: string;
  };
  creator?: {
    id: number;
    fullName: string;
  };
}

export interface CreateFloodDamageRequest {
  damageCategory: DamageCategory;
  description: string;
  estimatedValue: number;
  injuredCount?: number;
  deathCount?: number;
  reflectionId: number;
  householdId?: number;
}

export interface UpdateFloodDamageRequest {
  damageCategory?: DamageCategory;
  description?: string;
  estimatedValue?: number;
  injuredCount?: number;
  deathCount?: number;
  status?: DamageStatus;
  householdId?: number;
}

export interface FloodDamageFilter {
  search?: string;
  category?: DamageCategory;
  status?: DamageStatus;
  reflectionId?: number;
  householdId?: number;
  page?: number;
  limit?: number;
}

export interface FloodDamageStats {
  totalDamages: number;
  totalValue: number;
  totalInjured: number;
  totalDeaths: number;
  damages: FloodDamage[];
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  statusCode: number;
  message?: string;
}
