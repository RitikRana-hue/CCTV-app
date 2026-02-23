import { StreamConfig } from './stream';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterParams {
  search?: string;
  status?: string;
  groupId?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CameraListParams extends PaginationParams, FilterParams { }

export interface StreamControlRequest {
  cameraId: string;
  action: 'start' | 'stop' | 'restart';
  config?: Partial<StreamConfig>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export enum Permission {
  VIEW_CAMERAS = 'view_cameras',
  MANAGE_CAMERAS = 'manage_cameras',
  CONTROL_STREAMS = 'control_streams',
  MANAGE_USERS = 'manage_users',
  VIEW_LOGS = 'view_logs',
  SYSTEM_CONFIG = 'system_config'
}
