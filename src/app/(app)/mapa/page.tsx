import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { enviosParaMapa } from "@/lib/datos";
import { $ } from "@/lib/formato";
import { leerDesplazamiento, leerPeriodo } from "@/lib/periodos";
import { tituloPeriodo } from "@/lib/titulos";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import type { PuntoCalor } from "@/components/MapaCalor";
import { ubicarPendientes } from "../acciones";
import Mapa from "./Mapa";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

type Tipo = "destino" | "origen" | "ambos";
type Peso = "cantidad" | "plata";

export default async function PaginaMapa({ searchParams }: Props) {
  const s = await requerirSesion();
  const sp = await searchParams;
  const periodo = sp.p ? leerPeriodo(sp.p) : "semana";
  const n = leerDesplazamiento(sp.n);
  const tipo: Tipo = sp.tipo === "origen" || sp.tipo === "ambos" ? sp.tipo : "destino";
  const peso: Peso = sp.peso === "plata" ? "plata" : "cantidad";

  const { filas, desde, hasta } = await enviosParaMapa(s.uid, periodo, n);

  // Puntos y ranking de barrios según los filtros
  const puntos: PuntoCalor[] = [];
  const barrios = new Map<string, { envios: number; plata: number }>();
  for (const f of filas) {
    const valor = peso === "plata" ? Number(f.monto) : 1;
    const usar: ("origen" | "destino")[] = tipo === "ambos" ? ["origen", "destino"] : [tipo];
    for (const u of usar) {
      const lat = u === "origen" ? f.origen_lat : f.destino_lat;
      const lng = u === "origen" ? f.origen_lng : f.destino_lng;
      const barrio = u === "origen" ? f.origen_barrio : f.destino_barrio;
      if (lat != null && lng != null) puntos.push({ lat, lng, peso: valor });
      if (barrio) {
        const b = barrios.get(barrio) ?? { envios: 0, plata: 0 };
        b.envios += 1;
        b.plata += Number(f.monto);
        barrios.set(barrio, b);
      }
    }
  }
  const ranking = [...barrios.entries()]
    .sort((a, b) => (peso === "plata" ? b[1].plata - a[1].plata : b[1].envios - a[1].envios))
    .slice(0, 8);
  const maxRank = Math.max(1, ...ranking.map(([, b]) => (peso === "plata" ? b.plata : b.envios)));

  const pendientes = filas.filter((f) => f.sin_ubicar).length;
  const sinDireccion = filas.filter((f) => !f.con_direccion).length;

  const extra = `${tipo !== "destino" ? `&tipo=${tipo}` : ""}${peso !== "cantidad" ? `&peso=${peso}` : ""}`;
  const url = (cambios: Record<string, string>) => {
    const q = new URLSearchParams({ p: periodo, ...(n ? { n: String(n) } : {}), tipo, peso, ...cambios });
    return `/mapa?${q.toString()}`;
  };
  const chip = (activo: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs ${activo ? "border-acento bg-acento/20 text-texto" : "border-borde text-suave"}`;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Zonas calientes</h1>

      <SelectorPeriodo base="/mapa" periodo={periodo} n={n} titulo={tituloPeriodo(periodo, n, desde, hasta)} extra={extra} />

      <div className="flex flex-wrap gap-2">
        <Link href={url({ tipo: "destino" })} className={chip(tipo === "destino")}>Entregas</Link>
        <Link href={url({ tipo: "origen" })} className={chip(tipo === "origen")}>Retiros</Link>
        <Link href={url({ tipo: "ambos" })} className={chip(tipo === "ambos")}>Ambos</Link>
        <span className="mx-1 w-px bg-borde" />
        <Link href={url({ peso: "cantidad" })} className={chip(peso === "cantidad")}>Por cantidad</Link>
        <Link href={url({ peso: "plata" })} className={chip(peso === "plata")}>Por plata</Link>
      </div>

      <Mapa puntos={puntos} />

      <p className="text-xs text-suave">
        {puntos.length} punto{puntos.length === 1 ? "" : "s"} en el mapa de {filas.length} envío{filas.length === 1 ? "" : "s"}.
        {sinDireccion > 0 && ` ${sinDireccion} sin dirección cargada.`}
      </p>

      {pendientes > 0 && (
        <form action={ubicarPendientes} className="tarjeta flex items-center justify-between gap-3">
          <p className="text-sm">
            {pendientes} envío{pendientes === 1 ? "" : "s"} con dirección todavía sin ubicar.
          </p>
          <button className="shrink-0 rounded-lg bg-acento px-3 py-2 text-sm font-semibold text-white">Ubicar</button>
        </form>
      )}

      {ranking.length > 0 && (
        <section className="tarjeta">
          <p className="mb-3 text-sm text-suave">Barrios con más {peso === "plata" ? "plata" : "envíos"}</p>
          <ul className="space-y-2">
            {ranking.map(([nombre, b], i) => {
              const v = peso === "plata" ? b.plata : b.envios;
              return (
                <li key={nombre} className="text-sm">
                  <div className="mb-1 flex justify-between">
                    <span>
                      <span className="mr-2 text-suave">{i + 1}.</span>
                      {nombre}
                    </span>
                    <span className="tabular-nums text-suave">
                      {b.envios} · {$(b.plata)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-borde/50">
                    <div className="h-full rounded bg-gradient-to-r from-particular to-gasto" style={{ width: `${(v / maxRank) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {filas.length === 0 && (
        <p className="text-center text-sm text-suave">No hay envíos en este período.</p>
      )}
    </div>
  );
}
