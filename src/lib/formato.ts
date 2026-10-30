export const TZ = "America/Argentina/Buenos_Aires";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function $(n: number | string | null | undefined) {
  return pesos.format(Number(n ?? 0));
}

/** Fecha y hora actuales en Buenos Aires, como "YYYY-MM-DD" y "HH:MM" */
export function ahoraBA() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

export function horaBA(d: Date | string) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(d));
}

export function diaLargo(fechaISO: string) {
  // fechaISO = "YYYY-MM-DD"; se arma a mediodía para no correr de día por zona horaria
  const d = new Date(`${fechaISO}T12:00:00-03:00`);
  const s = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Convierte "2.803,73" o "2803.73" o "2803" en número */
export function parsearMonto(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  let s = String(v).trim().replace(/\$|\s/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export const NOMBRE_PLATAFORMA: Record<string, string> = {
  cabify: "Cabify",
  particular: "Particular",
  otra: "Otra app",
};

export const NOMBRE_MEDIO: Record<string, string> = {
  app: "Por app",
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export const CATEGORIAS_GASTO = [
  { id: "combustible", nombre: "Nafta", icono: "⛽" },
  { id: "comida", nombre: "Comida / bebida", icono: "🥤" },
  { id: "mantenimiento", nombre: "Mantenimiento", icono: "🔧" },
  { id: "seguro", nombre: "Seguro", icono: "🛡️" },
  { id: "celular", nombre: "Celular / datos", icono: "📱" },
  { id: "otro", nombre: "Otro", icono: "➕" },
] as const;

export function categoriaGasto(id: string) {
  return CATEGORIAS_GASTO.find((c) => c.id === id) ?? CATEGORIAS_GASTO[CATEGORIAS_GASTO.length - 1];
}
