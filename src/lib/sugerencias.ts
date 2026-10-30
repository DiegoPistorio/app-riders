import "server-only";

// Sugerencias de direcciones mientras se escribe, con Photon (komoot):
// buscador libre basado en OpenStreetMap, pensado para autocompletar y sin clave.
// (Nominatim, que se usa para ubicar direcciones escritas a mano, no permite autocompletar.)

export type Sugerencia = {
  texto: string; // lo que queda escrito en el campo
  detalle: string; // barrio, localidad · CP
  barrio: string | null;
  cp: string | null;
  lat: number;
  lng: number;
};

type FeaturePhoton = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
};

// Argentina entera; el resultado se ordena priorizando la zona de Buenos Aires
const BBOX_AR = "-73.6,-55.1,-53.6,-21.8";
const CENTRO = { lat: -34.6037, lon: -58.3816 };

const cache = new Map<string, { t: number; r: Sugerencia[] }>();
const TTL = 10 * 60 * 1000;

export async function buscarSugerencias(q: string): Promise<Sugerencia[]> {
  const consulta = q.trim().replace(/\s+/g, " ").slice(0, 120);
  if (consulta.length < 3) return [];
  const clave = consulta.toLowerCase();
  const c = cache.get(clave);
  if (c && Date.now() - c.t < TTL) return c.r;

  const url = new URL(process.env.PHOTON_URL || "https://photon.komoot.io/api/");
  url.searchParams.set("q", consulta);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lat", String(CENTRO.lat));
  url.searchParams.set("lon", String(CENTRO.lon));
  url.searchParams.set("bbox", BBOX_AR);
  for (const capa of ["house", "street", "district", "locality"]) url.searchParams.append("layer", capa);

  const res = await fetch(url, {
    headers: { "User-Agent": "app-riders/0.3 (github.com/DiegoPistorio/app-riders)" },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: FeaturePhoton[] };

  const vistos = new Set<string>();
  const r: Sugerencia[] = [];
  for (const f of data.features ?? []) {
    const p = f.properties;
    const calle = p.street ?? (p.type === "street" ? p.name : undefined);
    const principal = calle ? [calle, p.housenumber].filter(Boolean).join(" ") : p.name;
    if (!principal) continue;
    const barrio = p.district ?? p.locality ?? null;
    const localidad = p.city ?? p.county ?? p.state ?? null;
    const lugar = [barrio, localidad && localidad !== barrio ? localidad : null].filter(Boolean).join(", ");
    const cp = p.postcode ?? null;
    const detalle = [lugar, cp ? `CP ${cp}` : null].filter(Boolean).join(" · ");
    const texto = [principal, barrio ?? localidad].filter(Boolean).join(", ");
    if (vistos.has(texto + detalle)) continue;
    vistos.add(texto + detalle);
    r.push({
      texto,
      detalle,
      barrio: barrio ?? localidad,
      cp,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    });
  }

  cache.set(clave, { t: Date.now(), r });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return r;
}
