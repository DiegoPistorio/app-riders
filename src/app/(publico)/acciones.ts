"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { iniciarSesion } from "@/lib/auth";

export type EstadoForm = { error?: string } | undefined;

export async function registrar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const nombre = String(fd.get("nombre") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");

  if (!nombre || !email || !password) return { error: "Completá todos los campos." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "El email no parece válido." };
  if (password.length < 6) return { error: "La contraseña tiene que tener al menos 6 caracteres." };

  const existe = await query("SELECT 1 FROM usuarios WHERE email = $1", [email]);
  if (existe.length) return { error: "Ya hay una cuenta con ese email." };

  const hash = await bcrypt.hash(password, 10);
  const [u] = await query<{ id: number }>(
    "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1,$2,$3) RETURNING id",
    [nombre, email, hash],
  );
  await iniciarSesion({ uid: u.id, nombre });
  redirect("/");
}

export async function ingresar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");

  const [u] = await query<{ id: number; nombre: string; password_hash: string }>(
    "SELECT id, nombre, password_hash FROM usuarios WHERE email = $1",
    [email],
  );
  if (!u || !(await bcrypt.compare(password, u.password_hash))) {
    return { error: "Email o contraseña incorrectos." };
  }
  await iniciarSesion({ uid: u.id, nombre: u.nombre });
  redirect("/");
}
