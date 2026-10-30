// Firma y verificación de la cookie de sesión (sirve en middleware y en el servidor)
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESION = "sesion";
const DURACION_DIAS = 30;

function clave() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Falta AUTH_SECRET");
  return new TextEncoder().encode(s);
}

export type Sesion = { uid: number; nombre: string };

export async function firmarSesion(s: Sesion) {
  return new SignJWT({ nombre: s.nombre })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(s.uid))
    .setIssuedAt()
    .setExpirationTime(`${DURACION_DIAS}d`)
    .sign(clave());
}

export async function verificarSesion(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave());
    return { uid: Number(payload.sub), nombre: String(payload.nombre ?? "") };
  } catch {
    return null;
  }
}

export const MAX_AGE_SESION = DURACION_DIAS * 24 * 60 * 60;
