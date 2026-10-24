"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarUsuario } from "@/lib/actions/registro";

const TIPOS_VEHICULO = [
  { value: "moto", label: "Moto" },
  { value: "auto", label: "Auto" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "bicicleta_electrica", label: "Bicicleta eléctrica" },
];

export default function RegistroPage() {
  const [resultado, formAction, isPending] = useActionState(registrarUsuario, undefined);

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-12 max-w-sm w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6">Creá tu cuenta</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="name"
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          />
        </div>

        <hr className="my-2 border-gray-200" />
        <p className="text-sm font-medium text-gray-700">Tu vehículo</p>

        <div className="flex flex-col gap-1">
          <label htmlFor="vehiculoTipo" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="vehiculoTipo"
            name="vehiculoTipo"
            required
            defaultValue="moto"
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          >
            {TIPOS_VEHICULO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="kmPorLitro" className="text-sm font-medium">
            Km por litro (opcional)
          </label>
          <input
            id="kmPorLitro"
            name="kmPorLitro"
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            className="rounded-md border border-gray-300 px-3 py-2 text-base"
          />
        </div>

        {resultado?.error && (
          <p className="text-sm text-red-600">{resultado.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white font-medium disabled:opacity-60"
        >
          {isPending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-gray-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-blue-600 font-medium">
          Iniciá sesión
        </Link>
      </p>
    </main>
  );
}
