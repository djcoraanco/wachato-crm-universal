"use client";

import { useState } from "react";
import {
  Calendar,
  ClipboardList,
  Plus,
  Printer,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";

type Mesa = {
  id: string;
  numero: number;
  zona: string;
  capacidad: number;
  estado: "libre" | "ocupada" | "reservada";
  comensales?: number;
};

type MenuItem = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  alergenos: string[];
  disponible: boolean;
};

type Comanda = {
  id: string;
  mesa: number;
  items: Array<{ nombre: string; cantidad: number; nota?: string }>;
  estado: "pendiente" | "en_preparacion" | "servida";
  hora: string;
  total: number;
};

export function RestaurantesModuleView() {
  const [tab, setTab] = useState<"mesas" | "menu" | "comandas">("mesas");

  const [mesas, setMesas] = useState<Mesa[]>([
    { id: "m1", numero: 1, zona: "Terraza", capacidad: 4, estado: "ocupada", comensales: 3 },
    { id: "m2", numero: 2, zona: "Terraza", capacidad: 2, estado: "libre" },
    { id: "m3", numero: 3, zona: "Salón Principal", capacidad: 6, estado: "reservada" },
    { id: "m4", numero: 4, zona: "Salón Principal", capacidad: 4, estado: "libre" },
    { id: "m5", numero: 5, zona: "Barra", capacidad: 2, estado: "ocupada", comensales: 2 },
  ]);

  const [menu, setMenu] = useState<MenuItem[]>([
    { id: "p1", nombre: "Carpaccio de Res con Trufa", categoria: "Entradas", precio: 650, alergenos: ["Lácteos"], disponible: true },
    { id: "p2", nombre: "Risotto de Hongos Porcini", categoria: "Platos Fuertes", precio: 1100, alergenos: ["Lácteos"], disponible: true },
    { id: "p3", nombre: "Filete Angus a la Parrilla", categoria: "Platos Fuertes", precio: 1650, alergenos: [], disponible: true },
    { id: "p4", nombre: "Tiramisú Tradicional", categoria: "Postres", precio: 450, alergenos: ["Gluten", "Lácteos", "Huevo"], disponible: true },
  ]);

  const [comandas] = useState<Comanda[]>([
    {
      id: "c1",
      mesa: 1,
      items: [
        { nombre: "Carpaccio de Res con Trufa", cantidad: 1 },
        { nombre: "Filete Angus a la Parrilla", cantidad: 2, nota: "Término medio" },
      ],
      estado: "en_preparacion",
      hora: "13:42",
      total: 3950,
    },
    {
      id: "c2",
      mesa: 5,
      items: [
        { nombre: "Risotto de Hongos Porcini", cantidad: 2 },
        { nombre: "Tiramisú Tradicional", cantidad: 1 },
      ],
      estado: "pendiente",
      hora: "13:50",
      total: 2650,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas del Módulo */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        {[
          { id: "mesas" as const, label: "Mesas y Zonas", icon: Calendar },
          { id: "menu" as const, label: "Menú Digital & QR", icon: UtensilsCrossed },
          { id: "comandas" as const, label: "Comandas & Cocina (ESC/POS)", icon: ClipboardList },
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

      {/* VISTA 1: Mesas */}
      {tab === "mesas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg">Distribución de Sala y Mesas</h3>
            <button
              onClick={() => {
                const nextNum = mesas.length + 1;
                setMesas([
                  ...mesas,
                  { id: `m${nextNum}`, numero: nextNum, zona: "Salón Principal", capacidad: 4, estado: "libre" },
                ]);
              }}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar mesa
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {mesas.map((m) => {
              const bg =
                m.estado === "libre"
                  ? "border-accent/40 bg-accent-soft/20 text-accent"
                  : m.estado === "ocupada"
                    ? "border-danger/40 bg-danger/10 text-danger"
                    : "border-warning/40 bg-warning/10 text-warning";

              return (
                <div
                  key={m.id}
                  className={`card p-4 rounded-xl border flex flex-col justify-between h-32 ${bg}`}
                >
                  <div className="flex items-center justify-between">
                    <b className="text-base font-bold font-display text-fg">
                      Mesa #{m.numero}
                    </b>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-panel2">
                      {m.estado}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/80 font-medium">
                    <p>{m.zona}</p>
                    <p>Capacidad: {m.capacidad} personas</p>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        const nextEstado =
                          m.estado === "libre"
                            ? "ocupada"
                            : m.estado === "ocupada"
                              ? "reservada"
                              : "libre";
                        setMesas(
                          mesas.map((item) =>
                            item.id === m.id ? { ...item, estado: nextEstado } : item
                          )
                        );
                      }}
                      className="text-[11px] underline font-semibold text-fg hover:text-accent"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: Menú y QR */}
      {tab === "menu" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg">Catálogo de Platos & Bebidas</h3>
            <button
              onClick={() => alert("Código QR generado para mesa. El comensal puede escanear y ordenar.")}
              className="px-3 py-1.5 bg-panel2 border border-line text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:border-accent text-fg"
            >
              <QrCode className="h-4 w-4 text-accent" /> Imprimir QR de Mesas
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line bg-panel">
            <table className="w-full text-left text-xs">
              <thead className="bg-panel2 text-foreground/75 uppercase font-bold text-[11px] border-b border-line">
                <tr>
                  <th className="p-3">Plato</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Alérgenos</th>
                  <th className="p-3 text-right">Precio</th>
                  <th className="p-3 text-center">Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-fg">
                {menu.map((p) => (
                  <tr key={p.id} className="hover:bg-panel2/30">
                    <td className="p-3 font-semibold">{p.nombre}</td>
                    <td className="p-3 text-foreground/80 font-medium">{p.categoria}</td>
                    <td className="p-3 text-foreground/80">
                      {p.alergenos.length > 0 ? p.alergenos.join(", ") : "Ninguno"}
                    </td>
                    <td className="p-3 text-right font-bold text-accent font-display">
                      RD$ {p.precio.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={p.disponible}
                        onChange={(e) => {
                          setMenu(
                            menu.map((it) =>
                              it.id === p.id ? { ...it, disponible: e.target.checked } : it
                            )
                          );
                        }}
                        className="accent-[#00C4C0]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: Comandas & ESC/POS */}
      {tab === "comandas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg">Comandas en Cocina en Tiempo Real</h3>
            <button
              onClick={() => alert("Enviando comando ESC/POS a impresora térmica 80mm...")}
              className="px-3 py-1.5 bg-accent text-on-accent text-xs font-bold font-display rounded-lg flex items-center gap-1.5 hover:opacity-90"
            >
              <Printer className="h-4 w-4" /> Probar Ticket Térmico
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comandas.map((c) => (
              <div
                key={c.id}
                className="card p-4 rounded-xl border border-line bg-panel space-y-3 shadow-sm font-mono text-xs"
              >
                <div className="flex items-center justify-between border-b border-line/60 pb-2">
                  <b className="text-base text-accent font-bold">MESA #{c.mesa}</b>
                  <span className="text-foreground/75 font-medium">{c.hora}</span>
                  <span className="px-2 py-0.5 rounded bg-panel2 text-[10px] text-fg uppercase font-bold">
                    {c.estado}
                  </span>
                </div>
                <div className="space-y-1.5 py-1">
                  {c.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span>
                        {it.cantidad}x {it.nombre}
                      </span>
                      {it.nota && <span className="text-warning text-[10px]">({it.nota})</span>}
                    </div>
                  ))}
                </div>
                <div className="border-t border-line/60 pt-2 flex items-center justify-between font-bold text-sm text-fg">
                  <span>TOTAL ESTIMADO:</span>
                  <span className="text-accent">RD$ {c.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
