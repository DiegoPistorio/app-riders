import "server-only";
import { query } from "./db";

// Busca coordenadas de una dirección con OpenStreetMap (Nominatim).
// Gratis y sin clave; pide no superar 1 consulta por segundo y mandar un User-Agent.
// Los resultados se guardan en la tabla geocache para no repetir consultas.

type Punto = { lat: number; lng: number; barrio: string | null };

let ultimaConsulta = 0;

function armarConsulta(direccion: string) {
  const d = direccion.trim().replace(/\s+/g, " ");
  const ciudad = process.env.GEOCODE_CIUDAD || "Buenos Aires";
  // Si no tiene coma, se asume que es "calle número" y se agrega la ciudad
  const conCiudad = d.includes(",") ? d : `${d}, ${ciudad}`;
  return /argentina/i.test(conCiudad) ? conCiudad : `${conCiudad}, Argentina`;
}

export async function geocodificar(direccion: string | null | undefined): Promise<Punto | null> {
  if (!direccion || direccion.trim().length < 3) return null;
  const consulta = armarConsulta(direccion);
  const clave = consulta.toLowerCase();

  const cache = await query<{ lat: number | null; lng: number | null; barrio: string | null; encontrado: boolean }>(
    "SELECT lat, lng, barrio, encontrado FROM geocache WHERE consulta = $1",
    [clave],
  );
  if (cache.length) {
    const c = cache[0];
    return c.encontrado && c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng, barrio: c.barrio } : null;
  }

  // Respetar 1 consulta por segundo
  const espera = ultimaConsulta + 1100 - Date.now();
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaConsulta = Date.now();

  let punto: Punto | null = null;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", consulta);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "ar");
    url.searchParams.set("addressdetails", "1");
    const res = await fetch(url, {
      headers: { "User-Agent": "app-riders/0.2 (github.com/DiegoPistorio/app-riders)", "Accept-Language": "es" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null; // error temporal: no se cachea, se puede reintentar
    const data = (await res.json()) as Array<{ lat: string; lon: string; address?: Record<string, string> }>;
    if (data.length) {
      const a = data[0].address ?? {};
      const barrio = a.suburb || a.neighbourhood || a.city_district || a.quarter || a.town || a.city || null;
      punto = { lat: Number(data[0].lat), lng: Number(data[0].lon), barrio };
    }
  } catch {
    return null; // sin conexión o timeout: no se cachea
  }

  await query(
    `INSERT INTO geocache (consulta, lat, lng, barrio, encontrado) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (consulta) DO NOTHING`,
    [clave, punto?.lat ?? null, punto?.lng ?? null, punto?.barrio ?? null, !!punto],
  );
  return punto;
}
