"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { cargarGasto } from "@/lib/actions/gastos";

const CATEGORIAS = [
  { value: "nafta", label: "Nafta" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "seguro", label: "Seguro" },
  { value: "patente", label: "Patente" },
  { value: "alquiler", label: "Alquiler del vehículo" },
  { value: "otro", label: "Otro" },
];

export default function NuevoGastoPage() {
  const [resultado, formAction, isPending] = useActionState(cargarGasto, undefined);
  const [categoria, setCategoria] = useState("nafta");

  return (
    <main className="flex-1 px-4 py-6 max-w-md w-full mx-auto flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 text-sm">
          ← Volver
        </Link>
        <h1 className="text-xl font-bold">Cargar gasto</h1>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="categoria" className="text-sm font-medium">
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

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
          <label htmlFor="monto" className="text-sm font-medium">
            Monto ($)
          </label>
          <input
            id="monto"
            name="monto"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          />
        </div>

        {categoria === "nafta" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="litros" className="text-sm font-medium">
              Litros (opcional)
            </label>
            <input
              id="litros"
              name="litros"
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
              className="rounded-md border border-gray-300 px-3 py-2 text-base"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="odometro" className="text-sm font-medium">
            Odómetro (opcional)
          </label>
          <input
            id="odometro"
            name="odometro"
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="descripcion" className="text-sm font-medium">
            Descripción (opcional)
          </label>
          <input
            id="descripcion"
            name="descripcion"
            type="text"
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          />
        </div>

        {resultado?.error && <p className="text-sm text-red-600">{resultado.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white font-medium disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar gasto"}
        </button>
      </form>
    </main>
  );
}
