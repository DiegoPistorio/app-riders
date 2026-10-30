"use client";

import { useState } from "react";

/** Botón de borrar con confirmación en dos toques (sin diálogos del navegador) */
export default function BotonBorrar({ accion, id }: { accion: (fd: FormData) => Promise<void>; id: number }) {
  const [confirmar, setConfirmar] = useState(false);
  if (!confirmar)
    return (
      <button type="button" onClick={() => setConfirmar(true)} className="px-2 text-suave" aria-label="Borrar">
        🗑️
      </button>
    );
  return (
    <form action={accion} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <button className="rounded-lg bg-gasto px-2 py-1 text-xs font-semibold text-black">Borrar</button>
      <button type="button" onClick={() => setConfirmar(false)} className="px-1 text-xs text-suave">
        No
      </button>
    </form>
  );
}
