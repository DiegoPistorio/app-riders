export type Periodo = "dia" | "semana" | "mes";

export const UNIDAD: Record<Periodo, string> = { dia: "day", semana: "week", mes: "month" };

export function leerPeriodo(v: string | string[] | undefined): Periodo {
  return v === "semana" || v === "mes" ? v : "dia";
}

export function leerDesplazamiento(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n <= 0 && n > -1000 ? n : 0;
}
