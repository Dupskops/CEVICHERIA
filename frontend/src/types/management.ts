export type UserRole = "admin" | "employee";

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user: AuthUser;
}

export interface UserRecord extends AuthUser {
  phone?: string;
  created_at?: string;
}

export interface DishRecord {
  id: number | string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  active: boolean;
}

export type DishPayload = Omit<DishRecord, "id">;