"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { pool } from "@/lib/db";
import { signIn } from "@/auth";

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  vehiculoTipo: z.enum(["moto", "auto", "bicicleta", "bicicleta_electrica"]),
  kmPorLitro: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null)),
});

export type ResultadoRegistro = { error: string } | undefined;

export async function registrarUsuario(
  _prevState: ResultadoRegistro,
  formData: FormData
): Promise<ResultadoRegistro> {
  const parsed = esquemaRegistro.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
    vehiculoTipo: formData.get("vehiculoTipo"),
    kmPorLitro: formData.get("kmPorLitro") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { nombre, email, password, vehiculoTipo, kmPorLitro } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const usuarioResult = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [nombre, email, passwordHash]
    );
    const usuarioId = usuarioResult.rows[0].id;

    await client.query(
      `INSERT INTO vehiculos (usuario_id, tipo, km_por_litro)
       VALUES ($1, $2, $3)`,
      [usuarioId, vehiculoTipo, kmPorLitro]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && "code" in error && error.code === "23505") {
      return { error: "Ya existe una cuenta con ese email" };
    }
    throw error;
  } finally {
    client.release();
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "No se pudo iniciar sesión, probá ingresando manualmente" };
    }
    throw error;
  }
}
