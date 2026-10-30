import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { porDia, resumen } from "@/lib/datos";
import { $, horaBA } from "@/lib/formato";
import { leerDesplazamiento, leerPeriodo } from "@/lib/periodos";
import { tituloPeriodo } from "@/lib/titulos";
import SelectorPeriodo from "@/components/SelectorPeriodo";
import { salir } from "./acciones";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Fila({ label, valor, color, detalle, signo = "" }: { label: string; valor: number; color: string; detalle?: string; signo?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <div>
          <p className="text-sm">{label}</p>
          {detalle && <p className="text-xs text-suave">{detalle}</p>}
        </div>
      </div>
      <p className="font-semibold tabular-nums">
        {signo}
        {$(valor)}
      </p>
    </div>
  );
}

export default async function Inicio({ searchParams }: Props) {
  const s = await requerirSesion();
  const sp = await searchParams;
  const periodo = leerPeriodo(sp.p);
  const n = leerDesplazamiento(sp.n);

  const [r, dias] = await Promise.all([resumen(s.uid, periodo, n), periodo === "dia" ? Promise.resolve([]) : porDia(s.uid, periodo, n)]);

  const horas =
    periodo === "dia" && r.primerEnvio && r.ultimoEnvio && r.envios > 1
      ? (new Date(r.ultimoEnvio).getTime() - new Date(r.primerEnvio).getTime()) / 3_600_000
      : null;
  const maxDia = Math.max(1, ...dias.map((d) => d.ganado));
  const vacio = r.envios === 0 && r.gastos === 0;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Hola, {s.nombre.split(" ")[0]}</h1>
        <form action={salir}>
          <button className="text-sm text-suave underline">Salir</button>
        </form>
      </header>

      <SelectorPeriodo base="/" periodo={periodo} n={n} titulo={tituloPeriodo(periodo, n, r.desde, r.hasta)} />

      {/* Neto grande */}
      <section className="tarjeta text-center">
        <p className="text-sm text-suave">Neto real (ganado − gastos)</p>
        <p className={`mt-1 text-4xl font-extrabold tabular-nums ${r.neto < 0 ? "text-gasto" : ""}`}>{$(r.neto)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-suave">
          <div>
            <p className="text-base font-semibold text-texto">{r.envios}</p>envíos
          </div>
          <div>
            <p className="text-base font-semibold text-texto">{r.envios ? $(r.ganado / r.envios) : "—"}</p>por envío
          </div>
          <div>
            <p className="text-base font-semibold text-texto">{horas && horas >= 0.25 ? $(r.neto / horas) : "—"}</p>neto/hora
          </div>
        </div>
      </section>

      {/* Desglose de la plata */}
      <section className="tarjeta divide-y divide-borde py-1">
        <Fila label="Por app" detalle="Te lo deposita la app" valor={r.app} color="bg-app" />
        <Fila label="Efectivo de la app" detalle="Ya lo cobraste en mano" valor={r.appEfectivo} color="bg-efectivo" />
        <Fila label="Particulares" detalle={`${r.enviosParticular} envío${r.enviosParticular === 1 ? "" : "s"} por fuera`} valor={r.particular} color="bg-particular" />
        <div className="flex items-center justify-between py-2.5 font-semibold">
          <span className="text-sm">Total ganado</span>
          <span className="tabular-nums">{$(r.ganado)}</span>
        </div>
        <Fila label="Gastos" valor={r.gastos} color="bg-gasto" signo="−" />
      </section>

      {/* Plata en mano */}
      <section className={`tarjeta flex items-center justify-between ${r.enMano < 0 ? "border-gasto/50" : "border-efectivo/40"}`}>
        <div>
          <p className="text-sm font-semibold">👛 Plata en mano</p>
          <p className="text-xs text-suave">Efectivo cobrado − gastos</p>
        </div>
        <p className={`text-xl font-bold tabular-nums ${r.enMano < 0 ? "text-gasto" : "text-efectivo"}`}>{$(r.enMano)}</p>
      </section>
      {r.enMano < 0 && (
        <p className="-mt-3 px-1 text-xs text-suave">
          Negativo = pusiste {$(-r.enMano)} de tu bolsillo; lo recuperás con el depósito de la app.
        </p>
      )}

      {/* Barras por día */}
      {dias.length > 0 && (
        <section className="tarjeta">
          <p className="mb-3 text-sm text-suave">Ganado por día</p>
          <ul className="space-y-1.5">
            {dias.map((d) => {
              const f = new Date(`${d.fecha}T12:00:00-03:00`);
              const etiqueta = new Intl.DateTimeFormat("es-AR", {
                timeZone: "America/Argentina/Buenos_Aires",
                weekday: "short",
                day: "numeric",
              }).format(f);
              return (
                <li key={d.fecha}>
                  <Link href={`/historial?fecha=${d.fecha}`} className="flex items-center gap-2 text-xs">
                    <span className="w-14 shrink-0 capitalize text-suave">{etiqueta.replace(".", "")}</span>
                    <span className="h-5 flex-1 overflow-hidden rounded bg-borde/40">
                      <span className="block h-full rounded bg-acento" style={{ width: `${(d.ganado / maxDia) * 100}%` }} />
                    </span>
                    <span className="w-20 shrink-0 text-right tabular-nums">{d.ganado ? $(d.ganado) : "—"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {periodo === "dia" && r.primerEnvio && (
        <p className="text-center text-xs text-suave">
          Primer envío {horaBA(r.primerEnvio)} · último {horaBA(r.ultimoEnvio!)}
        </p>
      )}

      {vacio && (
        <p className="text-center text-sm text-suave">
          Sin movimientos en este período. Tocá <span className="text-texto">➕ Envío</span> para cargar el primero.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/envios/nuevo" className="btn-primario">Cargar envío</Link>
        <Link href="/gastos/nuevo" className="btn-secundario">Cargar gasto</Link>
      </div>
    </div>
  );
}
