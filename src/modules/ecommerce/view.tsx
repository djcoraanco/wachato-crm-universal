"use client";

import { useState } from "react";
import {
  CreditCard,
  Package,
  Plus,
  Send,
  ShoppingCart,
} from "lucide-react";

type Producto = {
  id: string;
  sku: string;
  nombre: string;
  precio: number;
  stockPrincipal: number;
  stockSecundario: number;
  variantes: string[];
};

export function EcommerceModuleView() {
  const [tab, setTab] = useState<"catalogo" | "carrito">("catalogo");

  const [productos, setProductos] = useState<Producto[]>([
    {
      id: "p1",
      sku: "SKU-BEAUTY-01",
      nombre: "Serum Facial de Vitamina C + Ácido Hialurónico",
      precio: 1850,
      stockPrincipal: 42,
      stockSecundario: 15,
      variantes: ["30ml", "50ml"],
    },
    {
      id: "p2",
      sku: "SKU-BEAUTY-02",
      nombre: "Protector Solar Mineral SPF 50+ Invisible",
      precio: 2200,
      stockPrincipal: 28,
      stockSecundario: 8,
      variantes: ["Tono Claro", "Tono Medio"],
    },
    {
      id: "p3",
      sku: "SKU-BEAUTY-03",
      nombre: "Crema Hidratante Reparadora con Ceramidas",
      precio: 1450,
      stockPrincipal: 60,
      stockSecundario: 20,
      variantes: ["Piel Grasa", "Piel Seca"],
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        {[
          { id: "catalogo" as const, label: "Catálogo, SKUs y Multialmacén", icon: Package },
          { id: "carrito" as const, label: "Carrito por Chat & Links de Pago", icon: ShoppingCart },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold font-display transition-colors ${
              tab === item.id
                ? "bg-accent text-on-accent"
                : "bg-panel2 text-foreground font-semibold hover:text-accent border border-line"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* VISTA 1: Catálogo y Stock Multialmacén */}
      {tab === "catalogo" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg">Inventario de Productos</h3>
            <button
              onClick={() => {
                const nextNum = productos.length + 1;
                setProductos([
                  ...productos,
                  {
                    id: `p${nextNum}`,
                    sku: `SKU-BEAUTY-0${nextNum}`,
                    nombre: "Nuevo Producto Cosmético",
                    precio: 1500,
                    stockPrincipal: 10,
                    stockSecundario: 5,
                    variantes: ["Estándar"],
                  },
                ]);
              }}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar producto
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line bg-panel">
            <table className="w-full text-left text-xs">
              <thead className="bg-panel2 text-foreground/75 uppercase font-bold text-[11px] border-b border-line">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Variantes</th>
                  <th className="p-3 text-right">Almacén Central</th>
                  <th className="p-3 text-right">Almacén Sucursal</th>
                  <th className="p-3 text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-fg">
                {productos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-panel2/30">
                    <td className="p-3 font-mono text-[11px] text-foreground/80 font-medium">{prod.sku}</td>
                    <td className="p-3 font-semibold">{prod.nombre}</td>
                    <td className="p-3 text-foreground/80">
                      <div className="flex gap-1 flex-wrap">
                        {prod.variantes.map((v) => (
                          <span
                            key={v}
                            className="px-1.5 py-0.5 rounded bg-panel2 text-[10px] text-fg border border-line"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-fg">
                      {prod.stockPrincipal} uds
                    </td>
                    <td className="p-3 text-right font-bold text-foreground/80">
                      {prod.stockSecundario} uds
                    </td>
                    <td className="p-3 text-right font-bold text-accent font-display">
                      RD$ {prod.precio.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: Carrito por Chat y Links de Pago */}
      {tab === "carrito" && (
        <div className="card p-5 rounded-xl border border-line bg-panel space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-fg">Generador de Checkout por WhatsApp</h3>
              <p className="text-xs text-muted">
                La IA o el operador humano pueden armar un carrito sobre la marcha y enviar un link de cobro seguro por Stripe o MercadoPago.
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-accent font-semibold bg-accent-soft px-3 py-1 rounded-full">
              <CreditCard className="h-4 w-4" /> Pagos Online Activos
            </span>
          </div>

          <div className="p-4 bg-panel2 border border-line rounded-xl space-y-3">
            <b className="text-xs font-bold text-fg block">Ejemplo de Link Generado para Chat</b>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="https://checkout.crm.com/pay/order_98412?gateway=stripe&amount=4050"
                className="flex-1 bg-panel border border-line rounded-lg px-3 py-2 text-xs font-mono text-muted select-all"
              />
              <button
                onClick={() => alert("Link de pago copiado al portapapeles.")}
                className="px-3.5 py-2 bg-accent text-on-accent text-xs font-bold font-display rounded-lg flex items-center gap-1.5 hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5" /> Enviar al Cliente
              </button>
            </div>
            <p className="text-[11px] text-muted">
              Al completarse el pago, el webhook de Stripe/MercadoPago actualiza el stock automáticamente y mueve el trato en el Pipeline a «Pago Confirmado».
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
