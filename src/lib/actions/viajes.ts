"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

const numeroOpcional = z
  .string()
  .optional()
  .transform((v) => (v ? Number(v) : null));

const esquemaViaje = z.object({
  plataforma: z.enum(["pedidosya", "rappi", "uber", "didi", "cabify"]),
  fecha: z.string().min(1, "Ingresá la fecha"),
  hora: z.string().optional(),
  montoRider: z.string().transform(Number).pipe(z.number().positive("El monto tiene que ser mayor a 0")),
  tarifa: numeroOpcional,
  comision: numeroOpcional,
  propina: numeroOpcional,
  categoria: z.string().optional().transform((v) => v || null),
  origenTexto: z.string().optional().transform((v) => v || null),
  destinoTexto: z.string().optional().transform((v) => v || null),
  paradasTexto: z.string().optional().transform((v) => v || null),
  duracionMinutos: numeroOpcional,
  distanciaKm: numeroOpcional,
});

export type ResultadoViaje = { error: string } | undefined;

export async function cargarViaje(
  _prevState: ResultadoViaje,
  formData: FormData
): Promise<ResultadoViaje> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) return { error: "Tenés que iniciar sesión" };

  const parsed = esquemaViaje.safeParse({
    plataforma: formData.get("plataforma"),
    fecha: formData.get("fecha"),
    hora: formData.get("hora") || undefined,
    montoRider: formData.get("montoRider"),
    tarifa: formData.get("tarifa") || undefined,
    comision: formData.get("comision") || undefined,
    propina: formData.get("propina") || undefined,
    categoria: formData.get("categoria") || undefined,
    origenTexto: formData.get("origenTexto") || undefined,
    destinoTexto: formData.get("destinoTexto") || undefined,
    paradasTexto: formData.get("paradasTexto") || undefined,
    duracionMinutos: formData.get("duracionMinutos") || undefined,
    distanciaKm: formData.get("distanciaKm") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { plataforma, fecha, hora, montoRider, tarifa, comision, propina, categoria, origenTexto, destinoTexto, paradasTexto, duracionMinutos, distanciaKm } =
    parsed.data;

  const fechaHora = `${fecha}T${hora || "12:00"}:00`;

  try {
    const { rows } = await pool.query("SELECT id FROM plataformas WHERE slug = $1", [plataforma]);
    const plataformaId = rows[0]?.id;
    if (!plataformaId) return { error: "Plataforma inválida" };

    await pool.query(
      `INSERT INTO viajes (
         usuario_id, plataforma_id, origen_dato, fecha, monto_rider,
         tarifa, comision, propina, categoria,
         origen_texto, destino_texto, paradas_texto,
         duracion_minutos, distancia_km
       ) VALUES ($1, $2, 'manual', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        usuarioId,
        plataformaId,
        fechaHora,
        montoRider,
        tarifa,
        comision,
        propina,
        categoria,
        origenTexto,
        destinoTexto,
        paradasTexto,
        duracionMinutos,
        distanciaKm,
      ]
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "23505") {
      return { error: "Ya tenés cargado un viaje con esa plataforma, fecha y monto" };
    }
    throw error;
  }

  redirect("/dashboard");
}
