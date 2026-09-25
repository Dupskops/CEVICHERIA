import type { AuthUser, DishPayload, DishRecord, LoginResponse, UserPayload, UserRecord } from "../types/management";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

const MOCK_USERS: UserRecord[] = [
  { id: 1, name: "Tanaka", email: "admin@dpenas.pe", role: "admin", active: true, phone: "+51 987 654 321" },
  { id: 2, name: "Carlos Paredes", email: "empleado@dpenas.pe", role: "employee", active: true, phone: "+51 912 345 678" },
  { id: 3, name: "Lucía Seminario", email: "lucia@dpenas.pe", role: "employee", active: false, phone: "+51 955 222 114" },
];

const MOCK_DISHES: DishRecord[] = [
  { id: 1, name: "Ceviche D'Peñas", description: "Pesca del día, leche de tigre, cebolla morada y camote.", price: 28, category: "Ceviches", available: true },
  { id: 2, name: "Arroz con Mariscos", description: "Arroz cremoso con calamar, langostino y conchas.", price: 32, category: "Arroces", available: true },
  { id: 3, name: "Tiradito Nikkei", description: "Láminas de pescado fresco con ponzu y ají amarillo.", price: 30, category: "Ceviches", available: true },
  { id: 4, name: "Chicharrón de Calamar", description: "Calamar crocante con salsa tártara de la casa.", price: 24, category: "Entradas", available: false },
];

function readMock<T>(key: string, initial: T): T {
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved) as T;
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

function writeMock<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function mockDelay<T>(value: T): Promise<T> {
  return new Promise(resolve => window.setTimeout(() => resolve(value), 220));
}

function mockUserFromToken(): AuthUser {
  const token = localStorage.getItem("cevicheria_token");
  const users = readMock("cevicheria_mock_users", MOCK_USERS);
  const user = users.find(item => `mock-token-${item.id}` === token && item.active);
  if (!user) throw new Error("La sesión simulada ya no es válida.");
  return user;
}

async function mockLogin(email: string, password: string): Promise<LoginResponse> {
  const credentials: Record<string, string> = {
    "admin@dpenas.pe": "Admin123!",
    "empleado@dpenas.pe": "Empleado123!",
  };
  const users = readMock("cevicheria_mock_users", MOCK_USERS);
  const user = users.find(item => item.email === email && item.active);
  if (!user || credentials[email] !== password) throw new Error("Correo o contraseña incorrectos.");
  return mockDelay({ access_token: `mock-token-${user.id}`, token_type: "bearer", user });
}

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

export const login = (email: string, password: string) => USE_MOCK_API ? mockLogin(email, password) : apiRequest<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const getCurrentUser = () => USE_MOCK_API ? mockDelay(mockUserFromToken()) : apiRequest<AuthUser>("/api/auth/me");
export const listUsers = () => USE_MOCK_API ? mockDelay(readMock("cevicheria_mock_users", MOCK_USERS)) : apiRequest<UserRecord[]>("/api/users");
export const createUser = (payload: UserPayload) => {
  if (!USE_MOCK_API) return apiRequest<UserRecord>("/api/users", { method: "POST", body: JSON.stringify(payload) });
  const users = readMock("cevicheria_mock_users", MOCK_USERS); const user = { ...payload, id: Date.now() } as UserRecord; writeMock("cevicheria_mock_users", [user, ...users]); return mockDelay(user);
};
export const updateUser = (id: number | string, payload: Partial<UserPayload>) => {
  if (!USE_MOCK_API) return apiRequest<UserRecord>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  const users = readMock("cevicheria_mock_users", MOCK_USERS); const current = users.find(item => item.id === id); if (!current) return Promise.reject(new Error("Usuario no encontrado.")); const user = { ...current, ...payload } as UserRecord; writeMock("cevicheria_mock_users", users.map(item => item.id === id ? user : item)); return mockDelay(user);
};
export const deleteUser = (id: number | string) => {
  if (!USE_MOCK_API) return apiRequest<void>(`/api/users/${id}`, { method: "DELETE" });
  const users = readMock("cevicheria_mock_users", MOCK_USERS); writeMock("cevicheria_mock_users", users.filter(item => item.id !== id)); return mockDelay(undefined);
};
export const listDishes = () => USE_MOCK_API ? mockDelay(readMock("cevicheria_mock_dishes", MOCK_DISHES)) : apiRequest<DishRecord[]>("/api/dishes");
export const createDish = (payload: DishPayload) => {
  if (!USE_MOCK_API) return apiRequest<DishRecord>("/api/dishes", { method: "POST", body: JSON.stringify(payload) });
  const dishes = readMock("cevicheria_mock_dishes", MOCK_DISHES); const dish = { ...payload, id: Date.now() } as DishRecord; writeMock("cevicheria_mock_dishes", [dish, ...dishes]); return mockDelay(dish);
};
export const updateDish = (id: number | string, payload: Partial<DishPayload>) => {
  if (!USE_MOCK_API) return apiRequest<DishRecord>(`/api/dishes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  const dishes = readMock("cevicheria_mock_dishes", MOCK_DISHES); const current = dishes.find(item => item.id === id); if (!current) return Promise.reject(new Error("Platillo no encontrado.")); const dish = { ...current, ...payload } as DishRecord; writeMock("cevicheria_mock_dishes", dishes.map(item => item.id === id ? dish : item)); return mockDelay(dish);
};
export const deleteDish = (id: number | string) => {
  if (!USE_MOCK_API) return apiRequest<void>(`/api/dishes/${id}`, { method: "DELETE" });
  const dishes = readMock("cevicheria_mock_dishes", MOCK_DISHES); writeMock("cevicheria_mock_dishes", dishes.filter(item => item.id !== id)); return mockDelay(undefined);
};
