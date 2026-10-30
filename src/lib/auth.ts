import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, MAX_AGE_SESION, firmarSesion, verificarSesion, type Sesion } from "./session";

export async function obtenerSesion() {
  const c = await cookies();
  return verificarSesion(c.get(COOKIE_SESION)?.value);
}

/** Devuelve la sesión o manda al login */
export async function requerirSesion(): Promise<Sesion> {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  return s;
}

export async function iniciarSesion(s: Sesion) {
  const c = await cookies();
  c.set(COOKIE_SESION, await firmarSesion(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_INSEGURA !== "1",
    path: "/",
    maxAge: MAX_AGE_SESION,
  });
}

export async function cerrarSesion() {
  const c = await cookies();
  c.delete(COOKIE_SESION);
}
