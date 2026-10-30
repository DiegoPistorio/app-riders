import Link from "next/link";
import type { Periodo } from "@/lib/periodos";

const TABS: { p: Periodo; label: string }[] = [
  { p: "dia", label: "Día" },
  { p: "semana", label: "Semana" },
  { p: "mes", label: "Mes" },
];

/** Tabs Día/Semana/Mes + flechas para ir a períodos anteriores (como en Cabify) */
export default function SelectorPeriodo({
  base,
  periodo,
  n,
  titulo,
  extra = "",
}: {
  base: string;
  periodo: Periodo;
  n: number;
  titulo: string;
  extra?: string;
}) {
  const url = (p: Periodo, k: number) => `${base}?p=${p}${k ? `&n=${k}` : ""}${extra}`;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 rounded-xl border border-borde p-1">
        {TABS.map((t) => (
          <Link
            key={t.p}
            href={url(t.p, 0)}
            className={`rounded-lg py-2 text-center text-sm ${periodo === t.p ? "bg-acento/25 font-semibold text-texto" : "text-suave"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Link href={url(periodo, n - 1)} className="rounded-lg border border-borde px-3 py-1.5 text-suave" aria-label="Anterior">
          ‹
        </Link>
        <span className="text-sm font-medium">{titulo}</span>
        {n < 0 ? (
          <Link href={url(periodo, n + 1)} className="rounded-lg border border-borde px-3 py-1.5 text-suave" aria-label="Siguiente">
            ›
          </Link>
        ) : (
          <span className="rounded-lg border border-borde/40 px-3 py-1.5 text-suave/30">›</span>
        )}
      </div>
    </div>
  );
}
