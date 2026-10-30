import { TZ, diaLargo } from "./formato";
import type { Periodo } from "./periodos";

export function tituloPeriodo(periodo: Periodo, n: number, desde: string, hasta: string) {
  if (periodo === "dia") return n === 0 ? `Hoy · ${diaLargo(desde)}` : n === -1 ? `Ayer · ${diaLargo(desde)}` : diaLargo(desde);
  const d = new Date(`${desde}T12:00:00-03:00`);
  const h = new Date(`${hasta}T12:00:00-03:00`);
  if (periodo === "mes") {
    const s = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, month: "long", year: "numeric" }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const dia = (x: Date) => new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "numeric" }).format(x);
  const mes = (x: Date) => new Intl.DateTimeFormat("es-AR", { timeZone: TZ, month: "short" }).format(x).replace(".", "");
  return mes(d) === mes(h) ? `${dia(d)} al ${dia(h)} de ${mes(h)}` : `${dia(d)} ${mes(d)} al ${dia(h)} ${mes(h)}`;
}
