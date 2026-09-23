/**
 * Carta de la Cevichería D'Peñas — sincronizada con el menú del asistente IA.
 */

import type {
  MenuCategory,
  MenuItem,
  PaymentMethod,
  SaleType,
} from "../types/sales";

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "ceviche-clasico",
    name: "Ceviche Clásico",
    description: "Pescado fresco marinado en limón con cebolla, ají y cilantro.",
    price: 25,
    category: "Fondo",
    emoji: "🍋",
  },
  {
    id: "ceviche-mixto",
    name: "Ceviche Mixto",
    description: "Mezcla de pescado, conchas, camarones y pulpo.",
    price: 35,
    category: "Fondo",
    emoji: "🦐",
  },
  {
    id: "chicharron-pescado",
    name: "Chicharrón de Pescado",
    description: "Trozos de pescado empanizados y fritos, acompañados de yuca.",
    price: 28,
    category: "Fondo",
    emoji: "🍤",
  },
  {
    id: "arroz-mariscos",
    name: "Arroz con Mariscos",
    description: "Arroz guisado con camarones, conchas, pulpo y calamar.",
    price: 32,
    category: "Fondo",
    emoji: "🍛",
  },
  {
    id: "jalea-mixta",
    name: "Jalea Mixta",
    description: "Fritura de pescado y mariscos con yuca y salsa criolla.",
    price: 38,
    category: "Fondo",
    emoji: "🍟",
  },
  {
    id: "sudado-pescado",
    name: "Sudado de Pescado",
    description: "Pescado cocido al vapor con tomate, cebolla y ají amarillo.",
    price: 30,
    category: "Fondo",
    emoji: "🍲",
  },
  {
    id: "parihuela",
    name: "Parihuela",
    description: "Sopa concentrada de mariscos y pescado.",
    price: 35,
    category: "Sopas",
    emoji: "🥘",
  },
  {
    id: "chupe-camarones",
    name: "Chupe de Camarones",
    description: "Sopa espesa de camarones con queso, leche y huevo.",
    price: 33,
    category: "Sopas",
    emoji: "🥣",
  },
  {
    id: "leche-tigre",
    name: "Leche de Tigre",
    description: "Clásico jugo de ceviche con trozos de pescado.",
    price: 15,
    category: "Entrantes",
    emoji: "🥤",
  },
  {
    id: "tiradito-pescado",
    name: "Tiradito de Pescado",
    description: "Láminas de pescado con salsa de ají amarillo.",
    price: 28,
    category: "Entrantes",
    emoji: "🐟",
  },
  {
    id: "chicha-morada",
    name: "Chicha Morada",
    description: "Bebida tradicional de maíz morado.",
    price: 6,
    category: "Bebidas",
    emoji: "🍷",
  },
  {
    id: "limonada-frozen",
    name: "Limonada Frozen",
    description: "Limonada preparada al momento con hielo.",
    price: 7,
    category: "Bebidas",
    emoji: "🍹",
  },
  {
    id: "inka-kola",
    name: "Inka Kola",
    description: "Gaseosa de 600 ml.",
    price: 5,
    category: "Bebidas",
    emoji: "🥤",
  },
  {
    id: "agua-mineral",
    name: "Agua Mineral",
    description: "Botella de agua sin gas de 625 ml.",
    price: 4,
    category: "Bebidas",
    emoji: "💧",
  },
];

export const MENU_CATEGORIES: MenuCategory[] = [
  "Entrantes",
  "Fondo",
  "Sopas",
  "Bebidas",
] as const;

/** Mapa de categoría → etiqueta legible. */
export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  Entrantes: "Entrantes",
  Fondo: "Platos de fondo",
  Sopas: "Sopas",
  Bebidas: "Bebidas",
};

/** Etiquetas para los métodos de pago. */
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  yape: "Yape / Plin",
};

/** Etiquetas para las modalidades de atención. */
export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  "dine-in": "En mesa",
  takeaway: "Para llevar",
  delivery: "Delivery",
};