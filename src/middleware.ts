import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/session";

const PUBLICAS = ["/login", "/registro"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sesion = await verificarSesion(req.cookies.get(COOKIE_SESION)?.value);
  const esPublica = PUBLICAS.some((p) => pathname.startsWith(p));

  if (!sesion && !esPublica) return NextResponse.redirect(new URL("/login", req.url));
  if (sesion && esPublica) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg).*)"],
};
