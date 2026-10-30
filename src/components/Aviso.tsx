"use client";

import { useEffect, useState } from "react";

/** Cartel que aparece unos segundos después de guardar */
export default function Aviso({ texto, clave }: { texto?: string; clave?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!clave) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [clave]);
  if (!visible || !texto) return null;
  return (
    <div className="fixed inset-x-0 top-4 z-[1100] mx-auto w-fit rounded-full bg-efectivo px-5 py-2 text-sm font-semibold text-black shadow-lg">
      ✓ {texto}
    </div>
  );
}
