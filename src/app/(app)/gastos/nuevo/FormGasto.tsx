"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Aviso from "@/components/Aviso";
import { CATEGORIAS_GASTO } from "@/lib/formato";
import { guardarGasto } from "../../acciones";

export default function FormGasto({ fecha, hora }: { fecha: string; hora: string }) {
  const [estado, accion, guardando] = useActionState(guardarGasto, undefined);
  const [categoria, setCategoria] = useState<string>("combustible");
  const [otroDia, setOtroDia] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const monto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!estado?.ok || !form.current) return;
    for (const n of ["monto", "litros", "descripcion"]) {
      const el = form.current.elements.namedItem(n) as HTMLInputElement | null;
      if (el) el.value = "";
    }
  }, [estado]);

  return (
    <form ref={form} action={accion} className="space-y-5">
      <Aviso texto={estado?.mensaje} clave={estado?.ok ? estado.n : undefined} />
      <input type="hidden" name="categoria" value={categoria} />
      <input type="hidden" name="ahora" value={otroDia ? "0" : "1"} />

      <div>
        <span className="etiqueta">¿En qué gastaste?</span>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIAS_GASTO.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategoria(c.id);
                monto.current?.focus();
              }}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs transition ${
                categoria === c.id ? "border-acento bg-acento/15 text-texto" : "border-borde bg-panel text-suave"
              }`}
            >
              <span className="text-2xl">{c.icono}</span>
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="etiqueta" htmlFor="monto">Monto</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-suave">$</span>
          <input
            ref={monto}
            id="monto"
            name="monto"
            inputMode="decimal"
            placeholder="5.000"
            className="campo pl-9 text-2xl font-bold"
            autoComplete="off"
            required
          />
        </div>
      </div>

      {categoria === "combustible" && (
        <div>
          <label className="etiqueta" htmlFor="litros">Litros (opcional)</label>
          <input id="litros" name="litros" inputMode="decimal" className="campo" placeholder="3,5" />
        </div>
      )}

      <div>
        <label className="etiqueta" htmlFor="descripcion">Detalle (opcional)</label>
        <input id="descripcion" name="descripcion" className="campo" placeholder="Ej: agua y turrón" />
      </div>

      <div className={otroDia ? "grid grid-cols-2 gap-3" : "hidden"}>
        <div>
          <label className="etiqueta" htmlFor="fecha">Fecha</label>
          <input id="fecha" name="fecha" type="date" defaultValue={fecha} className="campo" required />
        </div>
        <div>
          <label className="etiqueta" htmlFor="hora">Hora</label>
          <input id="hora" name="hora" type="time" defaultValue={hora} className="campo" required />
        </div>
      </div>
      {!otroDia && (
        <button type="button" onClick={() => setOtroDia(true)} className="text-sm text-acento">
          + Fue otro día u otra hora
        </button>
      )}

      {estado?.error && <p className="rounded-lg bg-gasto/10 px-3 py-2 text-sm text-gasto">{estado.error}</p>}

      <button className="btn-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar gasto"}
      </button>
    </form>
  );
}
