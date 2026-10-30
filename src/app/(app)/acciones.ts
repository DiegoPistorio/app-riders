"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { cerrarSesion, requerirSesion } from "@/lib/auth";
import { geocodificar } from "@/lib/geocode";
import { CATEGORIAS_GASTO, TZ, parsearMonto } from "@/lib/formato";

export type EstadoCarga = { ok?: boolean; error?: string; mensaje?: string; n?: number } | undefined;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

function texto(fd: FormData, k: string, max: number) {
  const v = String(fd.get(k) ?? "").trim();
  return v ? v.slice(0, max) : null;
}

function numeroOpcional(fd: FormData, k: string) {
  const v = parsearMonto(fd.get(k));
  return v == null ? null : v;
}

/** Busca coordenadas de origen/destino de un envío y las guarda */
async function ubicarEnvio(id: number, origen: string | null, destino: string | null) {
  const [o, d] = [await geocodificar(origen), await geocodificar(destino)];
  await query(
    `UPDATE envios SET origen_lat=$2, origen_lng=$3, origen_barrio=$4,
                       destino_lat=$5, destino_lng=$6, destino_barrio=$7
     WHERE id=$1`,
    [id, o?.lat ?? null, o?.lng ?? null, o?.barrio ?? null, d?.lat ?? null, d?.lng ?? null, d?.barrio ?? null],
  );
}

export async function guardarEnvio(prev: EstadoCarga, fd: FormData): Promise<EstadoCarga> {
  const s = await requerirSesion();

  const plataforma = String(fd.get("plataforma"));
  const medio = String(fd.get("medio_pago"));
  const monto = parsearMonto(fd.get("monto"));
  const fecha = String(fd.get("fecha") ?? "");
  const hora = String(fd.get("hora") ?? "");

  if (!["cabify", "particular", "otra"].includes(plataforma)) return { error: "Elegí la plataforma." };
  const mediosValidos = plataforma === "particular" ? ["efectivo", "transferencia"] : ["app", "efectivo"];
  if (!mediosValidos.includes(medio)) return { error: "Elegí cómo te pagaron." };
  if (monto == null || monto === 0) return { error: "Poné el monto del envío." };
  if (!FECHA.test(fecha) || !HORA.test(hora)) return { error: "Revisá la fecha y la hora." };

  const origen = texto(fd, "origen", 200);
  const destino = texto(fd, "destino", 200);

  const [e] = await query<{ id: number }>(
    `INSERT INTO envios (usuario_id, plataforma, medio_pago, monto, fecha_hora, origen, destino,
                         distancia_km, duracion_min, notas)
     VALUES ($1,$2,$3,$4, ($5 || ' ' || $6)::timestamp AT TIME ZONE '${TZ}', $7,$8,$9,$10,$11)
     RETURNING id`,
    [
      s.uid, plataforma, medio, monto, fecha, hora, origen, destino,
      numeroOpcional(fd, "distancia_km"),
      (() => { const v = numeroOpcional(fd, "duracion_min"); return v == null ? null : Math.round(v); })(),
      texto(fd, "notas", 300),
    ],
  );

  // Las coordenadas se buscan después de responder, así la carga es instantánea
  if (origen || destino) after(() => ubicarEnvio(e.id, origen, destino).catch(() => {}));

  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Envío guardado", n: (prev?.n ?? 0) + 1 };
}

export async function guardarGasto(prev: EstadoCarga, fd: FormData): Promise<EstadoCarga> {
  const s = await requerirSesion();

  const categoria = String(fd.get("categoria") ?? "");
  const monto = parsearMonto(fd.get("monto"));
  const fecha = String(fd.get("fecha") ?? "");
  const hora = String(fd.get("hora") ?? "");

  if (!CATEGORIAS_GASTO.some((c) => c.id === categoria)) return { error: "Elegí qué gastaste." };
  if (monto == null || monto === 0) return { error: "Poné el monto." };
  const ahora = fd.get("ahora") === "1"; // sin elegir fecha: se usa el momento de guardar
  if (!ahora && (!FECHA.test(fecha) || !HORA.test(hora))) return { error: "Revisá la fecha y la hora." };

  await query(
    `INSERT INTO gastos (usuario_id, categoria, monto, fecha_hora, litros, descripcion)
     VALUES ($1,$2,$3, CASE WHEN $4::text IS NULL THEN NOW() ELSE ($4 || ' ' || $5)::timestamp AT TIME ZONE '${TZ}' END, $6, $7)`,
    [s.uid, categoria, monto, ahora ? null : fecha, ahora ? null : hora, categoria === "combustible" ? numeroOpcional(fd, "litros") : null, texto(fd, "descripcion", 200)],
  );

  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Gasto guardado", n: (prev?.n ?? 0) + 1 };
}

export async function borrarEnvio(fd: FormData) {
  const s = await requerirSesion();
  await query("DELETE FROM envios WHERE id = $1 AND usuario_id = $2", [Number(fd.get("id")), s.uid]);
  revalidatePath("/", "layout");
}

export async function borrarGasto(fd: FormData) {
  const s = await requerirSesion();
  await query("DELETE FROM gastos WHERE id = $1 AND usuario_id = $2", [Number(fd.get("id")), s.uid]);
  revalidatePath("/", "layout");
}

/** Reintenta ubicar en el mapa los envíos con dirección que todavía no tienen coordenadas */
export async function ubicarPendientes() {
  const s = await requerirSesion();
  const pendientes = await query<{ id: number; origen: string | null; destino: string | null }>(
    `SELECT id, origen, destino FROM envios
     WHERE usuario_id = $1
       AND ((origen IS NOT NULL AND origen_lat IS NULL) OR (destino IS NOT NULL AND destino_lat IS NULL))
     ORDER BY fecha_hora DESC LIMIT 15`,
    [s.uid],
  );
  for (const p of pendientes) await ubicarEnvio(p.id, p.origen, p.destino);
  revalidatePath("/mapa");
}

export async function salir() {
  await cerrarSesion();
  redirect("/login");
}
