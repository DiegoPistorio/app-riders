"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ingresar, registrar } from "./acciones";

export default function FormAcceso({ modo }: { modo: "login" | "registro" }) {
  const [estado, accion, cargando] = useActionState(modo === "login" ? ingresar : registrar, undefined);
  const esLogin = modo === "login";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-acento text-2xl">🛵</div>
        <h1 className="text-2xl font-bold">App Riders</h1>
        <p className="mt-1 text-sm text-suave">Tu plata clara al final del día</p>
      </div>

      <form action={accion} className="space-y-4">
        {!esLogin && (
          <div>
            <label className="etiqueta" htmlFor="nombre">Nombre</label>
            <input className="campo" id="nombre" name="nombre" autoComplete="given-name" required />
          </div>
        )}
        <div>
          <label className="etiqueta" htmlFor="email">Email</label>
          <input className="campo" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="etiqueta" htmlFor="password">Contraseña</label>
          <input
            className="campo"
            id="password"
            name="password"
            type="password"
            autoComplete={esLogin ? "current-password" : "new-password"}
            minLength={esLogin ? undefined : 6}
            required
          />
        </div>

        {estado?.error && <p className="rounded-lg bg-gasto/10 px-3 py-2 text-sm text-gasto">{estado.error}</p>}

        <button className="btn-primario" disabled={cargando}>
          {cargando ? "Un momento…" : esLogin ? "Ingresar" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-suave">
        {esLogin ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
        <Link className="text-acento underline" href={esLogin ? "/registro" : "/login"}>
          {esLogin ? "Registrate" : "Ingresá"}
        </Link>
      </p>
    </main>
  );
}
