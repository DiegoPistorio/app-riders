"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Segmentado from "@/components/Segmentado";
import Aviso from "@/components/Aviso";
import InputDireccion from "@/components/InputDireccion";
import { guardarEnvio } from "../../acciones";

type Plataforma = "cabify" | "particular" | "otra";
type Medio = "app" | "efectivo" | "transferencia";

export default function FormEnvio({ fecha, hora }: { fecha: string; hora: string }) {
  const [estado, accion, guardando] = useActionState(guardarEnvio, undefined);
  const [plataforma, setPlataforma] = useState<Plataforma>("cabify");
  const [medio, setMedio] = useState<Medio>("app");
  const [masDatos, setMasDatos] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const monto = useRef<HTMLInputElement>(null);

  // Al guardar: limpia monto y direcciones, mantiene plataforma/medio/fecha para cargar el siguiente rápido
  useEffect(() => {
    if (!estado?.ok || !form.current) return;
    for (const n of ["monto", "distancia_km", "duracion_min", "notas"]) {
      const el = form.current.elements.namedItem(n) as HTMLInputElement | null;
      if (el) el.value = "";
    }
    monto.current?.focus();
  }, [estado]);

  function cambiarPlataforma(p: Plataforma) {
    setPlataforma(p);
    setMedio(p === "particular" ? "efectivo" : "app");
  }

  const medios =
    plataforma === "particular"
      ? [{ valor: "efectivo" as Medio, label: "💵 Efectivo" }, { valor: "transferencia" as Medio, label: "🏦 Transferencia" }]
      : [{ valor: "app" as Medio, label: "💳 Por app" }, { valor: "efectivo" as Medio, label: "💵 Efectivo" }];

  return (
    <form ref={form} action={accion} className="space-y-5">
      <Aviso texto={estado?.mensaje} clave={estado?.ok ? estado.n : undefined} />

      <div>
        <span className="etiqueta">¿De dónde es el envío?</span>
        <Segmentado
          name="plataforma"
          valor={plataforma}
          onChange={cambiarPlataforma}
          opciones={[
            { valor: "cabify", label: "Cabify" },
            { valor: "particular", label: "Particular" },
            { valor: "otra", label: "Otra app" },
          ]}
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="monto">
          {plataforma === "particular" ? "¿Cuánto cobraste?" : "Monto que te queda (\"para ti\")"}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-suave">$</span>
          <input
            ref={monto}
            id="monto"
            name="monto"
            inputMode="decimal"
            placeholder="2.803,73"
            className="campo pl-9 text-2xl font-bold"
            autoComplete="off"
            required
          />
        </div>
      </div>

      <div>
        <span className="etiqueta">¿Cómo te pagaron?</span>
        <Segmentado name="medio_pago" valor={medio} onChange={setMedio} opciones={medios} />
        {plataforma !== "particular" && (
          <p className="mt-1.5 text-xs text-suave">
            {medio === "app" ? "Te lo deposita la app (suma al saldo a cobrar)." : "Ya lo tenés en la mano."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta" htmlFor="fecha">Fecha</label>
          <input id="fecha" name="fecha" type="date" defaultValue={fecha} className="campo" required />
        </div>
        <div>
          <label className="etiqueta" htmlFor="hora">Hora</label>
          <input id="hora" name="hora" type="time" defaultValue={hora} className="campo" required />
        </div>
      </div>

      <div className="space-y-3">
        {/* key: se reinician al guardar cada envío */}
        <InputDireccion key={`o${estado?.n ?? 0}`} name="origen" label="Retiro (origen)" placeholder="Empezá a escribir: 3 de Febrero 1067" />
        <InputDireccion key={`d${estado?.n ?? 0}`} name="destino" label="Entrega (destino)" placeholder="Empezá a escribir: Libertador 5665" />
        <p className="text-xs text-suave">Opcional. Elegí una sugerencia para que quede exacta en el mapa de zonas.</p>
      </div>

      <button type="button" onClick={() => setMasDatos((v) => !v)} className="text-sm text-acento">
        {masDatos ? "− Menos datos" : "+ Distancia, duración y notas"}
      </button>

      <div className={masDatos ? "space-y-3" : "hidden"}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="etiqueta" htmlFor="distancia_km">Distancia (km)</label>
            <input id="distancia_km" name="distancia_km" inputMode="decimal" className="campo" placeholder="1,8" />
          </div>
          <div>
            <label className="etiqueta" htmlFor="duracion_min">Duración (min)</label>
            <input id="duracion_min" name="duracion_min" inputMode="numeric" className="campo" placeholder="8" />
          </div>
        </div>
        <div>
          <label className="etiqueta" htmlFor="notas">Notas</label>
          <input id="notas" name="notas" className="campo" placeholder="Ej: paquete grande" />
        </div>
      </div>

      {estado?.error && <p className="rounded-lg bg-gasto/10 px-3 py-2 text-sm text-gasto">{estado.error}</p>}

      <button className="btn-primario" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar envío"}
      </button>
    </form>
  );
}
