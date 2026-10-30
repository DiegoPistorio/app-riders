import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { movimientosDelDia } from "@/lib/datos";
import { $, NOMBRE_MEDIO, NOMBRE_PLATAFORMA, ahoraBA, categoriaGasto, diaLargo, horaBA } from "@/lib/formato";
import BotonBorrar from "@/components/BotonBorrar";
import { borrarEnvio, borrarGasto } from "../acciones";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ fecha?: string }> };

function sumarDias(fecha: string, d: number) {
  const x = new Date(`${fecha}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + d);
  return x.toISOString().slice(0, 10);
}

const COLOR_MEDIO: Record<string, string> = {
  app: "bg-app/15 text-app",
  efectivo: "bg-efectivo/15 text-efectivo",
  transferencia: "bg-particular/15 text-particular",
};

export default async function Historial({ searchParams }: Props) {
  const s = await requerirSesion();
  const hoy = ahoraBA().fecha;
  const sp = await searchParams;
  const fecha = sp.fecha && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) && sp.fecha <= hoy ? sp.fecha : hoy;
  const { envios, gastos } = await movimientosDelDia(s.uid, fecha);

  const ganado = envios.reduce((a, e) => a + Number(e.monto), 0);
  const gastado = gastos.reduce((a, g) => a + Number(g.monto), 0);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Historial</h1>

      <div className="flex items-center justify-between">
        <Link href={`/historial?fecha=${sumarDias(fecha, -1)}`} className="rounded-lg border border-borde px-3 py-1.5 text-suave">‹</Link>
        <div className="text-center">
          <p className="text-sm font-medium">{fecha === hoy ? "Hoy" : diaLargo(fecha)}</p>
          {fecha === hoy && <p className="text-xs text-suave">{diaLargo(fecha)}</p>}
        </div>
        {fecha < hoy ? (
          <Link href={`/historial?fecha=${sumarDias(fecha, 1)}`} className="rounded-lg border border-borde px-3 py-1.5 text-suave">›</Link>
        ) : (
          <span className="rounded-lg border border-borde/40 px-3 py-1.5 text-suave/30">›</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="tarjeta">
          <p className="text-xs text-suave">Ganado</p>
          <p className="text-lg font-bold tabular-nums">{$(ganado)}</p>
        </div>
        <div className="tarjeta">
          <p className="text-xs text-suave">Gastos</p>
          <p className="text-lg font-bold tabular-nums text-gasto">{$(gastado)}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm text-suave">Envíos ({envios.length})</h2>
        {envios.length === 0 ? (
          <p className="tarjeta text-center text-sm text-suave">Sin envíos este día.</p>
        ) : (
          <ul className="tarjeta divide-y divide-borde py-0">
            {envios.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="text-suave">{horaBA(e.fecha_hora)}</span> · {NOMBRE_PLATAFORMA[e.plataforma]}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${COLOR_MEDIO[e.medio_pago]}`}>
                      {NOMBRE_MEDIO[e.medio_pago]}
                    </span>
                  </p>
                  {(e.origen || e.destino) && (
                    <p className="mt-0.5 truncate text-xs text-suave">
                      {e.origen && e.destino ? `${e.origen} → ${e.destino}` : e.origen ? `Retiro: ${e.origen}` : `Entrega: ${e.destino}`}
                    </p>
                  )}
                  {(e.distancia_km || e.duracion_min || e.notas) && (
                    <p className="mt-0.5 text-xs text-suave">
                      {[e.distancia_km && `${Number(e.distancia_km)} km`, e.duracion_min && `${e.duracion_min} min`, e.notas]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-semibold tabular-nums">{$(e.monto)}</span>
                  <BotonBorrar accion={borrarEnvio} id={e.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm text-suave">Gastos ({gastos.length})</h2>
        {gastos.length === 0 ? (
          <p className="tarjeta text-center text-sm text-suave">Sin gastos este día.</p>
        ) : (
          <ul className="tarjeta divide-y divide-borde py-0">
            {gastos.map((g) => {
              const c = categoriaGasto(g.categoria);
              return (
                <li key={g.id} className="flex items-start justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="text-suave">{horaBA(g.fecha_hora)}</span> · {c.icono} {c.nombre}
                    </p>
                    {(g.descripcion || g.litros) && (
                      <p className="mt-0.5 truncate text-xs text-suave">
                        {[g.litros && `${Number(g.litros)} L`, g.descripcion].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-semibold tabular-nums text-gasto">−{$(g.monto)}</span>
                    <BotonBorrar accion={borrarGasto} id={g.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
