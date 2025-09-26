export interface UserServiceConfig {
  id: number;
  user_id: number;
  service: string;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserServiceConfigRequest {
  service: string;
  credentials: Record<string, string>;
  settings?: Record<string, unknown>;
}

export interface UpdateUserServiceConfigRequest {
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
  is_active?: boolean;
}
