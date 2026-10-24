"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

const numeroOpcional = z
  .string()
  .optional()
  .transform((v) => (v ? Number(v) : null));

const esquemaGasto = z.object({
  categoria: z.enum(["nafta", "mantenimiento", "seguro", "patente", "alquiler", "otro"]),
  fecha: z.string().min(1, "Ingresá la fecha"),
  monto: z.string().transform(Number).pipe(z.number().positive("El monto tiene que ser mayor a 0")),
  litros: numeroOpcional,
  odometro: numeroOpcional,
  descripcion: z.string().optional().transform((v) => v || null),
});

export type ResultadoGasto = { error: string } | undefined;

export async function cargarGasto(
  _prevState: ResultadoGasto,
  formData: FormData
): Promise<ResultadoGasto> {
  const session = await auth();
  const usuarioId = session?.user?.id;
  if (!usuarioId) return { error: "Tenés que iniciar sesión" };

  const parsed = esquemaGasto.safeParse({
    categoria: formData.get("categoria"),
    fecha: formData.get("fecha"),
    monto: formData.get("monto"),
    litros: formData.get("litros") || undefined,
    odometro: formData.get("odometro") || undefined,
    descripcion: formData.get("descripcion") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { categoria, fecha, monto, litros, odometro, descripcion } = parsed.data;

  const { rows } = await pool.query(
    `SELECT id FROM vehiculos WHERE usuario_id = $1 AND activo = true ORDER BY created_at ASC LIMIT 1`,
    [usuarioId]
  );
  const vehiculoId = rows[0]?.id ?? null;

  await pool.query(
    `INSERT INTO gastos (usuario_id, vehiculo_id, categoria, fecha, monto, litros, odometro, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [usuarioId, vehiculoId, categoria, fecha, monto, litros, odometro, descripcion]
  );

  redirect("/dashboard");
}
