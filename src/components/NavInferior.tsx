"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Resumen", icono: "📊" },
  { href: "/historial", label: "Historial", icono: "🗓️" },
  { href: "/envios/nuevo", label: "Envío", icono: "➕", destacado: true },
  { href: "/gastos/nuevo", label: "Gasto", icono: "⛽" },
  { href: "/mapa", label: "Zonas", icono: "🗺️" },
];

export default function NavInferior() {
  const ruta = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-borde bg-fondo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((it) => {
          const activo = it.href === "/" ? ruta === "/" : ruta.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${activo ? "text-acento" : "text-suave"}`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${it.destacado ? "bg-acento text-white" : ""}`}
                >
                  {it.icono}
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
