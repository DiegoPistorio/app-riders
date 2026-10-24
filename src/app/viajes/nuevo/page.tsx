"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cargarViaje } from "@/lib/actions/viajes";

const PLATAFORMAS = [
  { value: "pedidosya", label: "PedidosYa" },
  { value: "rappi", label: "Rappi" },
  { value: "uber", label: "Uber" },
  { value: "didi", label: "DiDi" },
  { value: "cabify", label: "Cabify" },
];

export default function NuevoViajePage() {
  const [resultado, formAction, isPending] = useActionState(cargarViaje, undefined);

  return (
    <main className="flex-1 px-4 py-6 max-w-md w-full mx-auto flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 text-sm">
          ← Volver
        </Link>
        <h1 className="text-xl font-bold">Cargar viaje</h1>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="plataforma" className="text-sm font-medium">
            Plataforma
          </label>
          <select
            id="plataforma"
            name="plataforma"
            required
            defaultValue="pedidosya"
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          >
            {PLATAFORMAS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="fecha" className="text-sm font-medium">
              Fecha
            </label>
            <input
              id="fecha"
              name="fecha"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-md border border-gray-300 px-3 py-2 text-base"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hora" className="text-sm font-medium">
              Hora (opcional)
            </label>
            <input
              id="hora"
              name="hora"
              type="time"
              className="rounded-md border border-gray-300 px-3 py-2 text-base"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="montoRider" className="text-sm font-medium">
            Lo que te quedó a vos ($)
          </label>
          <input
            id="montoRider"
            name="montoRider"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          />
        </div>

        <details className="rounded-md border border-gray-200 px-3 py-2">
          <summary className="text-sm font-medium cursor-pointer">
            Más datos (opcional)
          </summary>
          <div className="flex flex-col gap-3 mt-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="tarifa" className="text-xs font-medium">
                  Tarifa
                </label>
                <input
                  id="tarifa"
                  name="tarifa"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="rounded-md border border-gray-300 px-2 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="comision" className="text-xs font-medium">
                  Comisión
                </label>
                <input
                  id="comision"
                  name="comision"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="rounded-md border border-gray-300 px-2 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="propina" className="text-xs font-medium">
                  Propina
                </label>
                <input
                  id="propina"
                  name="propina"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="rounded-md border border-gray-300 px-2 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="categoria" className="text-sm font-medium">
                Categoría
              </label>
              <input
                id="categoria"
                name="categoria"
                type="text"
                placeholder="Ej: Envíos en moto"
                className="rounded-md border border-gray-300 px-3 py-2 text-base"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="origenTexto" className="text-sm font-medium">
                Origen
              </label>
              <input
                id="origenTexto"
                name="origenTexto"
                type="text"
                className="rounded-md border border-gray-300 px-3 py-2 text-base"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="paradasTexto" className="text-sm font-medium">
                Paradas
              </label>
              <input
                id="paradasTexto"
                name="paradasTexto"
                type="text"
                className="rounded-md border border-gray-300 px-3 py-2 text-base"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="destinoTexto" className="text-sm font-medium">
                Destino
              </label>
              <input
                id="destinoTexto"
                name="destinoTexto"
                type="text"
                className="rounded-md border border-gray-300 px-3 py-2 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="duracionMinutos" className="text-sm font-medium">
                  Duración (min)
                </label>
                <input
                  id="duracionMinutos"
                  name="duracionMinutos"
                  type="number"
                  inputMode="numeric"
                  className="rounded-md border border-gray-300 px-3 py-2 text-base"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="distanciaKm" className="text-sm font-medium">
                  Distancia (km)
                </label>
                <input
                  id="distanciaKm"
                  name="distanciaKm"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  className="rounded-md border border-gray-300 px-3 py-2 text-base"
                />
              </div>
            </div>
          </div>
        </details>

        {resultado?.error && <p className="text-sm text-red-600">{resultado.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white font-medium disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar viaje"}
        </button>
      </form>
    </main>
  );
}
