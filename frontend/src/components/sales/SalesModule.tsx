/**
 * SalesModule — Módulo de Ventas.
 * Punto de venta (POS) y control de ventas con indicadores e historial.
 * Incluye una región aria-live global de anuncios.
 */

import { useEffect, useState } from "react";
import { useSales } from "../../hooks/useSales";
import { listDishes } from "../../services/managementApi";
import type { MenuItem } from "../../types/sales";
import POSPanel from "./POSPanel";
import SalesDashboard from "./SalesDashboard";

type SalesTab = "pos" | "control";

export default function SalesModule() {
  const {
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
    registerSale,
    deleteSale,
    stats,
  } = useSales();

  const [tab, setTab] = useState<SalesTab>("pos");
  const [announcement, setAnnouncement] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (!announcement) return;
    const t = setTimeout(() => setAnnouncement(""), 6000);
    return () => clearTimeout(t);
  }, [announcement]);

  // Cargar platillos desde el backend
  useEffect(() => {
    listDishes().then((dishes) => {
      setMenuItems(
        dishes
          .filter((d) => d.available)
          .map((d) => ({
            id: d.id.toString(),
            name: d.name,
            description: d.description,
            price: d.price,
            category: (["Entrantes", "Fondo", "Sopas", "Bebidas"].includes(d.category)
              ? d.category
              : "Fondo") as any,
            emoji: "🍲",
          }))
      );
    }).catch(console.error);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">💰 Módulo de Ventas</h2>
        <p className="text-sm text-slate-500 mt-1">
          Registra pedidos en el punto de venta y controla la facturación del día.
        </p>
      </header>

      {/* Región accesible de anuncios */}
      <div aria-live="polite" role="status">
        {announcement && (
          <p className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm animate-fade-in">
            ✔ {announcement}
          </p>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-slate-100/80 rounded-xl p-1 w-fit" role="tablist" aria-label="Secciones de ventas">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "pos"}
          onClick={() => setTab("pos")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "pos"
              ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-600 hover:bg-white/70"
          }`}
        >
          🛎️ Nueva venta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "control"}
          onClick={() => setTab("control")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "control"
              ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-600 hover:bg-white/70"
          }`}
        >
          📊 Control de ventas
        </button>
      </div>

      {tab === "pos" ? (
        <POSPanel
          menuItems={menuItems}
          cart={cart}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          discount={discount}
          setDiscount={setDiscount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          customerName={customerName}
          setCustomerName={setCustomerName}
          orderType={orderType}
          setOrderType={setOrderType}
          cashReceived={cashReceived}
          setCashReceived={setCashReceived}
          subtotal={subtotal}
          total={total}
          change={change}
          registerSale={async () => {
            const sale = await registerSale();
            if (sale) {
              setAnnouncement(
                `Venta ${sale.code} registrada correctamente por ${sale.total.toFixed(2)} soles.`
              );
            }
            return sale;
          }}
        />
      ) : (
        <SalesDashboard
          sales={sales}
          stats={stats}
          onDelete={(id) => {
            const sale = sales.find((s) => s.id === id);
            deleteSale(id);
            if (sale) setAnnouncement(`Venta ${sale.code} eliminada del historial.`);
          }}
        />
      )}
    </div>
  );
}