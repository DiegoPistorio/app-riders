"use client";

import { useEffect, useRef, useState } from "react";

type Sugerencia = { texto: string; detalle: string; barrio: string | null; cp: string | null; lat: number; lng: number };

/**
 * Campo de dirección con sugerencias mientras escribís (como Google Maps).
 * Si elegís una sugerencia, se guardan las coordenadas exactas en campos ocultos
 * (<name>_lat, <name>_lng, <name>_barrio). Si no, la dirección escrita se ubica después.
 */
export default function InputDireccion({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  const [texto, setTexto] = useState("");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [elegida, setElegida] = useState<Sugerencia | null>(null);
  const [activa, setActiva] = useState(-1);
  const caja = useRef<HTMLDivElement>(null);

  // Buscar con una pausa de 350 ms después de la última tecla
  useEffect(() => {
    if (elegida || texto.trim().length < 3) {
      setSugerencias([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/direcciones?q=${encodeURIComponent(texto)}`, { signal: ctrl.signal });
        const data: Sugerencia[] = r.ok ? await r.json() : [];
        setSugerencias(data);
        setActiva(-1);
        setAbierto(true);
      } catch {
        /* búsqueda cancelada o sin conexión */
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [texto, elegida]);

  // Cerrar la lista al tocar afuera
  useEffect(() => {
    const fuera = (e: PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, []);

  function elegir(s: Sugerencia) {
    setElegida(s);
    setTexto(s.texto);
    setAbierto(false);
  }

  function teclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!abierto || !sugerencias.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((i) => Math.min(i + 1, sugerencias.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activa >= 0) {
      e.preventDefault(); // elegir, no enviar el formulario
      elegir(sugerencias[activa]);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  return (
    <div ref={caja} className="relative">
      <label className="etiqueta" htmlFor={name}>{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setElegida(null);
          }}
          onFocus={() => sugerencias.length && setAbierto(true)}
          onKeyDown={teclas}
          className={`campo pr-10 ${elegida ? "border-efectivo/60" : ""}`}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={abierto}
          aria-autocomplete="list"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
          {elegida ? "📍" : buscando ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-suave border-t-transparent" /> : ""}
        </span>
      </div>

      {elegida && (
        <p className="mt-1 text-xs text-efectivo">
          Ubicación exacta{elegida.detalle ? ` · ${elegida.detalle}` : ""}
        </p>
      )}

      <input type="hidden" name={`${name}_lat`} value={elegida?.lat ?? ""} />
      <input type="hidden" name={`${name}_lng`} value={elegida?.lng ?? ""} />
      <input type="hidden" name={`${name}_barrio`} value={elegida?.barrio ?? ""} />

      {abierto && texto.trim().length >= 3 && !elegida && (
        <ul role="listbox" className="absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-borde bg-panel shadow-2xl">
          {sugerencias.length === 0 && !buscando && (
            <li className="px-4 py-3 text-sm text-suave">Sin sugerencias. Podés dejarla escrita igual.</li>
          )}
          {sugerencias.map((s, i) => (
            <li key={`${s.lat},${s.lng},${i}`} role="option" aria-selected={i === activa}>
              <button
                type="button"
                onClick={() => elegir(s)}
                className={`w-full px-4 py-2.5 text-left ${i === activa ? "bg-acento/20" : "hover:bg-borde/40"}`}
              >
                <p className="text-sm">{s.texto}</p>
                {s.detalle && <p className="text-xs text-suave">{s.detalle}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
