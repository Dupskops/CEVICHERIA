/**
 * POSPanel — Punto de venta.
 * Catálogo de la carta con búsqueda y categorías, carrito editable,
 * descuentos, modalidades de atención y cobro (efectivo/tarjeta/yape)
 * con cálculo de vuelto. Incluye regiones aria-live.
 */

import { useMemo, useState, type FormEvent } from "react";
import {
  CATEGORY_LABELS,
  MENU_CATEGORIES,
  MENU_ITEMS,
  PAYMENT_LABELS,
  SALE_TYPE_LABELS,
} from "../../data/menu";
import type {
  CartItem,
  MenuItem,
  PaymentMethod,
  Sale,
  SaleType,
} from "../../types/sales";
import { formatCurrency } from "../../utils/format";

interface POSPanelProps {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  discount: number;
  setDiscount: (v: number) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  orderType: SaleType;
  setOrderType: (v: SaleType) => void;
  cashReceived: number;
  setCashReceived: (v: number) => void;
  subtotal: number;
  total: number;
  change: number;
  registerSale: () => Promise<Sale | null>;
}

const PAYMENT_METHODS: PaymentMethod[] = ["efectivo", "tarjeta", "yape"];
const SALE_TYPES: SaleType[] = ["dine-in", "takeaway", "delivery"];

export default function POSPanel({
  cart,
  addToCart,
  updateQuantity,
  removeFromCart,
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
  registerSale,
}: POSPanelProps) {
  const [category, setCategory] = useState<(typeof MENU_CATEGORIES)[number] | "todos">(
    "todos"
  );
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      const byCategory = category === "todos" || item.category === category;
      const bySearch =
        !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      return byCategory && bySearch;
    });
  }, [category, search]);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || total <= 0) return;
    const sale = await registerSale();
    if (sale) {
      setNotice(
        `Venta ${sale.code} registrada por ${formatCurrency(sale.total)}. ${sale.paymentMethod === "efectivo" ? `Vuelto: ${formatCurrency(change)}.` : ""}`
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleCheckout();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* Catálogo */}
      <section
        className="xl:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-4"
        aria-label="Carta del día"
      >
        <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:items-center">
          <div className="flex-1">
            <label htmlFor="pos-search" className="sr-only">
              Buscar plato
            </label>
            <input
              id="pos-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plato o descripción..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar por categoría">
            <button
              type="button"
              onClick={() => setCategory("todos")}
              aria-pressed={category === "todos"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                category === "todos"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-sky-50"
              }`}
            >
              Todos
            </button>
            {MENU_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  category === c
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-sky-50"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            No se encontraron platos con ese criterio.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {visibleItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(item);
                    setNotice(`${item.name} agregado a la orden.`);
                  }}
                  className="w-full text-left rounded-xl border border-slate-200/70 bg-white p-3 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
                  aria-label={`Agregar ${item.name} a la orden, ${formatCurrency(item.price)}`}
                >
                  <span className="text-2xl block mb-1" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="block text-sm font-semibold text-slate-800 leading-tight">
                    {item.name}
                  </span>
                  <span className="block text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                    {item.description}
                  </span>
                  <span className="block mt-1.5 text-sm font-bold text-sky-700">
                    {formatCurrency(item.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Anuncio de agregado */}
        <p aria-live="polite" className="sr-only">
          {notice}
        </p>
      </section>

      {/* Carrito / Cobro */}
      <section className="flex flex-col bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-4 sticky top-20">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">
          Orden actual{" "}
          {cartCount > 0 && (
            <span className="ml-1 text-[11px] font-medium bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
              {cartCount} ítems
            </span>
          )}
        </h3>

        {/* Lista del carrito */}
        <div className="flex-1 space-y-2 min-h-24 max-h-72 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              El carrito está vacío. Agrega platos de la carta.
            </p>
          ) : (
            cart.map(({ itemId, item, quantity }) => (
              <div
                key={itemId}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatCurrency(item.price)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(itemId, quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                    aria-label={`Quitar una unidad de ${item.name}`}
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-slate-700" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(itemId, quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                    aria-label={`Agregar una unidad de ${item.name}`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(itemId)}
                    className="ml-1 text-rose-500 hover:text-rose-700 text-xs"
                    aria-label={`Eliminar ${item.name} de la orden`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulario de cobro */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Modalidad */}
          <fieldset>
            <legend className="text-xs font-medium text-slate-600 mb-1.5">
              Modalidad de atención
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {SALE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  aria-pressed={orderType === t}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    orderType === t
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-sky-50"
                  }`}
                >
                  {SALE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Cliente */}
          <div>
            <label htmlFor="pos-customer" className="block text-xs font-medium text-slate-600 mb-1">
              Cliente
            </label>
            <input
              id="pos-customer"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre del cliente (opcional)"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
            />
          </div>

          {/* Descuento */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="pos-discount" className="block text-xs font-medium text-slate-600 mb-1">
                Descuento (S/.)
              </label>
              <input
                id="pos-discount"
                type="number"
                min={0}
                step={0.5}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
              />
            </div>
            <div>
              <label htmlFor="pos-pay" className="block text-xs font-medium text-slate-600 mb-1">
                Método de pago
              </label>
              <select
                id="pos-pay"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Efectivo recibido */}
          {paymentMethod === "efectivo" && (
            <div>
              <label htmlFor="pos-cash" className="block text-xs font-medium text-slate-600 mb-1">
                Monto recibido (S/.)
              </label>
              <input
                id="pos-cash"
                type="number"
                min={0}
                step={0.5}
                value={cashReceived}
                onChange={(e) => setCashReceived(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
              />
              <p aria-live="polite" className="mt-1 text-[11px] text-slate-500">
                {total > 0 && cashReceived < total
                  ? `Faltan ${formatCurrency(total - cashReceived)} por pagar.`
                  : change > 0
                    ? `Vuelto: ${formatCurrency(change)}`
                    : ""}
              </p>
            </div>
          )}

          {/* Totales */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <p className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </p>
            {discount > 0 && (
              <p className="flex justify-between text-sm text-rose-500">
                <span>Descuento</span>
                <span>−{formatCurrency(Math.min(discount, subtotal))}</span>
              </p>
            )}
            <p className="flex justify-between text-base font-bold text-slate-800">
              <span>Total</span>
              <span aria-live="polite">{formatCurrency(total)}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={cart.length === 0 || total <= 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 transition-all"
          >
            Registrar venta · {formatCurrency(total)}
          </button>
        </form>

        {/* Anuncio de venta registrada */}
        <p aria-live="polite" role="status" className="mt-3 text-xs text-emerald-700 text-center font-medium">
          {notice.includes("registrada") ? notice : ""}
        </p>
      </section>
    </div>
  );
}