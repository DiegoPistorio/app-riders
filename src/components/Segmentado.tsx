"use client";

// Selector tipo "pastillas" (reemplaza al <select> para tocar rápido en el celular)
export default function Segmentado<T extends string>({
  name,
  opciones,
  valor,
  onChange,
}: {
  name: string;
  opciones: { valor: T; label: string }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}>
      <input type="hidden" name={name} value={valor} />
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          className={`rounded-xl border px-2 py-3 text-sm font-medium transition ${
            valor === o.valor ? "border-acento bg-acento/15 text-texto" : "border-borde bg-panel text-suave"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
