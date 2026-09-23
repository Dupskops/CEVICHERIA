/**
 * Hook personalizado del módulo de Ventas.
 * Punto de venta (carrito), registro de ventas y control estadístico,
 * con persistencia en localStorage.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CartItem,
  MenuItem,
  PaymentMethod,
  Sale,
  SaleItem,
  SaleStats,
  SaleType,
} from "../types/sales";
import { todayISO } from "../utils/format";
import { generateCode, generateId } from "../utils/id";

const STORAGE_KEY = "cevicheria.sales.v1";

/** Lee las ventas persistidas en localStorage. */
function loadSales(): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Sale[]) : [];
  } catch {
    return [];
  }
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>(loadSales);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState<SaleType>("dine-in");
  const [cashReceived, setCashReceived] = useState(0);

  /** Persiste las ventas en cada cambio. */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
  }, [sales]);

  /** Agrega un plato al carrito (incrementa cantidad si ya existe). */
  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        return prev
          .map((c) =>
            c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
          )
          .filter((c) => c.quantity <= 99);
      }
      return [...prev, { itemId: item.id, item, quantity: 1 }];
    });
  }, []);

  /** Modifica la cantidad de un ítem; si llega a 0 se elimina. */
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.itemId === itemId ? { ...c, quantity } : c))
        .filter((c) => c.quantity > 0)
    );
  }, []);

  /** Elimina un ítem del carrito. */
  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  }, []);

  /** Vacía el carrito y sus campos asociados. */
  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setCashReceived(0);
  }, []);

  /** Subtotal, descuento y total del carrito. */
  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0),
    [cart]
  );
  const total = useMemo(
    () => Math.max(0, subtotal - Math.min(discount, subtotal)),
    [subtotal, discount]
  );

  /** Si el pago es en efectivo, calcula el vuelto a entregar. */
  const change = useMemo(
    () => (paymentMethod === "efectivo" ? Math.max(0, cashReceived - total) : 0),
    [paymentMethod, cashReceived, total]
  );

  /** Registra la venta actual del carrito y la agrega al historial. */
  const registerSale = useCallback((): Sale | null => {
    if (cart.length === 0 || total <= 0) return null;

    const items: SaleItem[] = cart.map((c) => ({
      itemId: c.itemId,
      name: c.item.name,
      unitPrice: c.item.price,
      quantity: c.quantity,
      subtotal: c.item.price * c.quantity,
    }));

    const sale: Sale = {
      id: generateId("sale"),
      code: generateCode("V", sales.length + 1),
      items,
      subtotal,
      discount: Math.min(discount, subtotal),
      total,
      paymentMethod,
      customerName: customerName.trim() || "Cliente general",
      orderType,
      saleDate: new Date().toISOString(),
    };

    setSales((prev) => [sale, ...prev]);
    clearCart();
    return sale;
  }, [
    cart,
    subtotal,
    discount,
    total,
    paymentMethod,
    customerName,
    orderType,
    sales.length,
    clearCart,
  ]);

  /** Elimina una venta del historial. */
  const deleteSale = useCallback((id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /** Indicadores para el panel de control. */
  const stats: SaleStats = useMemo(() => {
    const today = todayISO();
    const todaysSales = sales.filter((s) => s.saleDate.slice(0, 10) === today);
    const todayRevenue = todaysSales.reduce((sum, s) => sum + s.total, 0);
    const todayCount = todaysSales.length;
    const avgTicket = todayCount > 0 ? todayRevenue / todayCount : 0;

    const counts = new Map<string, number>();
    sales.forEach((s) =>
      s.items.forEach((it) => counts.set(it.name, (counts.get(it.name) ?? 0) + it.quantity))
    );
    let bestSeller: SaleStats["bestSeller"] = null;
    let max = 0;
    counts.forEach((quantity, name) => {
      if (quantity > max) {
        max = quantity;
        bestSeller = { name, quantity };
      }
    });

    return {
      todayRevenue,
      todayCount,
      avgTicket,
      totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
      totalSales: sales.length,
      bestSeller,
    };
  }, [sales]);

  return {
    sales,
    cart,
    discount,
    setDiscount,
    paymentMethod,
    setPaymentMethod,
    customerName,
    setCustomerName,
    orderType,
    setOrderType,
    cashReceived,
    setCashReceived,
    subtotal,
    total,
    change,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    registerSale,
    deleteSale,
    stats,
  };
}