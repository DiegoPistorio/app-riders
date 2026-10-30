import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { buscarSugerencias } from "@/lib/sugerencias";

export async function GET(req: NextRequest) {
  if (!(await obtenerSesion())) return NextResponse.json([], { status: 401 });
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    return NextResponse.json(await buscarSugerencias(q));
  } catch {
    return NextResponse.json([]); // si el buscador no responde, simplemente no hay sugerencias
  }
}
