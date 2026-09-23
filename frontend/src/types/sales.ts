/**
 * Tipos TypeScript para el módulo de Ventas.
 */

/** Categorías de la carta. */
export type MenuCategory = "Entrantes" | "Fondo" | "Sopas" | "Bebidas";

/** Plato o producto de la carta. */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  emoji: string;
}

/** Ítem dentro del carrito de compras. */
export interface CartItem {
  itemId: string;
  item: MenuItem;
  quantity: number;
}

/** Línea de una venta registrada. */
export interface SaleItem {
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

/** Métodos de pago aceptados. */
export type PaymentMethod = "efectivo" | "tarjeta" | "yape";

/** Modalidades de atención de la orden. */
export type SaleType = "dine-in" | "takeaway" | "delivery";

/** Venta registrada en el punto de venta. */
export interface Sale {
  id: string;
  code: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  orderType: SaleType;
  saleDate: string;
}

/** Indicadores calculados del control de ventas. */
export interface SaleStats {
  todayRevenue: number;
  todayCount: number;
  avgTicket: number;
  totalRevenue: number;
  totalSales: number;
  bestSeller: { name: string; quantity: number } | null;
}