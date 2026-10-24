"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion } from "@/lib/actions/login";

export default function LoginPage() {
  const [resultado, formAction, isPending] = useActionState(iniciarSesion, undefined);

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-12 max-w-sm w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>

      <form action={formAction} className="flex flex-col gap-4">
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
            autoComplete="current-password"
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
          {isPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-gray-600">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-blue-600 font-medium">
          Registrate
        </Link>
      </p>
    </main>
  );
}
