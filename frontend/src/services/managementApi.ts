import type { AuthUser, DishPayload, DishRecord, LoginResponse, UserPayload, UserRecord } from "../types/management";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true"; // Disabled by default

// Fallbacks simulados (en caso de fallar o usar mock explícito)
const MOCK_USERS: UserRecord[] = [];
const MOCK_DISHES: DishRecord[] = [];
function mockDelay<T>(value: T): Promise<T> { return new Promise(resolve => window.setTimeout(() => resolve(value), 220)); }

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("cevicheria_token");
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.message;
    throw new Error(detail || `No se pudo completar la solicitud (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const login = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', email); // FastAPI OAuth2 usa 'username'
  formData.append('password', password);
  
  const response = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString()
  });
  
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Correo o contraseña incorrectos.");
  }
  const data = await response.json();
  // El endpoint real no retorna el 'user' directamente, así que lo inyectamos temporalmente 
  // para que el frontend mantenga el flujo (en la práctica se decodifica del JWT o del /me).
  return {
    ...data,
    user: { id: 1, name: "Admin (Backend)", email: email, role: "admin", active: true }
  } as LoginResponse;
};

// Temporalmente mapeamos /me al mismo usuario
export const getCurrentUser = () => mockDelay({ id: 1, name: "Admin (Backend)", email: "admin@dpenas.pe", role: "admin", active: true } as AuthUser);

export const listUsers = () => apiRequest<UserRecord[]>("/api/usuarios");
export const createUser = (payload: UserPayload) => apiRequest<UserRecord>("/api/usuarios", { method: "POST", body: JSON.stringify(payload) });
export const updateUser = (id: number | string, payload: Partial<UserPayload>) => apiRequest<UserRecord>(`/api/usuarios/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteUser = (id: number | string) => apiRequest<void>(`/api/usuarios/${id}`, { method: "DELETE" });

export const listDishes = () => apiRequest<DishRecord[]>("/api/platillos");
export const createDish = (payload: DishPayload) => apiRequest<DishRecord>("/api/platillos", { method: "POST", body: JSON.stringify(payload) });
export const updateDish = (id: number | string, payload: Partial<DishPayload>) => apiRequest<DishRecord>(`/api/platillos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteDish = (id: number | string) => apiRequest<void>(`/api/platillos/${id}`, { method: "DELETE" });

// === Reservas ===
export const listReservations = () => apiRequest<any[]>("/api/reservas");
export const createReservation = (payload: any) => apiRequest<any>("/api/reservas", { method: "POST", body: JSON.stringify(payload) });
export const deleteReservation = (id: number | string) => apiRequest<void>(`/api/reservas/${id}`, { method: "DELETE" });

// === Ventas ===
export const listSales = () => apiRequest<any[]>("/api/ventas");
export const createSale = (payload: any) => apiRequest<any>("/api/ventas", { method: "POST", body: JSON.stringify(payload) });
export const deleteSale = (id: number | string) => apiRequest<void>(`/api/ventas/${id}`, { method: "DELETE" });
