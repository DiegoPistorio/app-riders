import "server-only";
import { query } from "./db";
import { TZ } from "./formato";
import { UNIDAD, type Periodo } from "./periodos";

// Rango [desde, hasta) del período en hora de Buenos Aires.
// n = 0 es el período actual, -1 el anterior, etc. Las semanas van de lunes a domingo (igual que Cabify).
const RANGO = `
  r AS (
    SELECT d AS desde, d + ('1 ' || $2)::interval AS hasta
    FROM (SELECT (date_trunc($2, now() AT TIME ZONE '${TZ}') + ($3 || ' ' || $2)::interval) AT TIME ZONE '${TZ}' AS d) x
  )`;

export type Resumen = {
  desde: string; // YYYY-MM-DD (BA)
  hasta: string; // YYYY-MM-DD último día incluido (BA)
  app: number; // Cabify/otra app cobrado por la app → te lo depositan
  appEfectivo: number; // Cabify/otra app cobrado en efectivo
  particular: number; // envíos por fuera de las apps
  efectivoTotal: number; // todo lo cobrado en efectivo
  ganado: number;
  gastos: number;
  neto: number;
  enMano: number; // efectivo cobrado − gastos
  envios: number;
  enviosApp: number;
  enviosParticular: number;
  primerEnvio: string | null;
  ultimoEnvio: string | null;
};

export async function resumen(uid: number, periodo: Periodo, n = 0): Promise<Resumen> {
  const [f] = await query<Record<string, string | number | null>>(
    `WITH ${RANGO},
     e AS (
       SELECT
         COALESCE(SUM(monto) FILTER (WHERE plataforma <> 'particular' AND medio_pago = 'app'), 0)      AS app,
         COALESCE(SUM(monto) FILTER (WHERE plataforma <> 'particular' AND medio_pago = 'efectivo'), 0) AS app_efectivo,
         COALESCE(SUM(monto) FILTER (WHERE plataforma = 'particular'), 0)                              AS particular,
         COALESCE(SUM(monto) FILTER (WHERE medio_pago = 'efectivo'), 0)                                AS efectivo_total,
         COUNT(*)                                                                                      AS envios,
         COUNT(*) FILTER (WHERE plataforma <> 'particular')                                            AS envios_app,
         COUNT(*) FILTER (WHERE plataforma = 'particular')                                             AS envios_particular,
         MIN(fecha_hora) AS primer, MAX(fecha_hora) AS ultimo
       FROM envios, r
       WHERE usuario_id = $1 AND fecha_hora >= r.desde AND fecha_hora < r.hasta
     ),
     g AS (
       SELECT COALESCE(SUM(monto), 0) AS gastos
       FROM gastos, r
       WHERE usuario_id = $1 AND fecha_hora >= r.desde AND fecha_hora < r.hasta
     )
     SELECT e.*, g.gastos,
            to_char(r.desde AT TIME ZONE '${TZ}', 'YYYY-MM-DD') AS desde,
            to_char((r.hasta AT TIME ZONE '${TZ}') - interval '1 day', 'YYYY-MM-DD') AS hasta
     FROM e, g, r`,
    [uid, UNIDAD[periodo], String(n)],
  );

  const num = (k: string) => Number(f[k] ?? 0);
  const ganado = num("app") + num("app_efectivo") + num("particular");
  return {
    desde: String(f.desde),
    hasta: String(f.hasta),
    app: num("app"),
    appEfectivo: num("app_efectivo"),
    particular: num("particular"),
    efectivoTotal: num("efectivo_total"),
    ganado,
    gastos: num("gastos"),
    neto: ganado - num("gastos"),
    enMano: num("efectivo_total") - num("gastos"),
    envios: num("envios"),
    enviosApp: num("envios_app"),
    enviosParticular: num("envios_particular"),
    primerEnvio: f.primer ? String(f.primer) : null,
    ultimoEnvio: f.ultimo ? String(f.ultimo) : null,
  };
}

export type FilaDia = { fecha: string; ganado: number; gastos: number; envios: number };

/** Totales por día dentro del período (para semana y mes) */
export async function porDia(uid: number, periodo: Periodo, n = 0): Promise<FilaDia[]> {
  const filas = await query<{ fecha: string; ganado: string; gastos: string; envios: string }>(
    `WITH ${RANGO},
     dias AS (
       SELECT generate_series(r.desde AT TIME ZONE '${TZ}', (r.hasta AT TIME ZONE '${TZ}') - interval '1 day', interval '1 day')::date AS fecha
       FROM r
     ),
     e AS (
       SELECT (fecha_hora AT TIME ZONE '${TZ}')::date AS fecha, SUM(monto) AS ganado, COUNT(*) AS envios
       FROM envios, r WHERE usuario_id = $1 AND fecha_hora >= r.desde AND fecha_hora < r.hasta GROUP BY 1
     ),
     g AS (
       SELECT (fecha_hora AT TIME ZONE '${TZ}')::date AS fecha, SUM(monto) AS gastos
       FROM gastos, r WHERE usuario_id = $1 AND fecha_hora >= r.desde AND fecha_hora < r.hasta GROUP BY 1
     )
     SELECT to_char(d.fecha, 'YYYY-MM-DD') AS fecha,
            COALESCE(e.ganado, 0) AS ganado, COALESCE(g.gastos, 0) AS gastos, COALESCE(e.envios, 0) AS envios
     FROM dias d LEFT JOIN e USING (fecha) LEFT JOIN g USING (fecha)
     ORDER BY d.fecha`,
    [uid, UNIDAD[periodo], String(n)],
  );
  return filas.map((f) => ({ fecha: f.fecha, ganado: Number(f.ganado), gastos: Number(f.gastos), envios: Number(f.envios) }));
}

export type Envio = {
  id: number;
  plataforma: string;
  medio_pago: string;
  monto: string;
  fecha_hora: string;
  origen: string | null;
  destino: string | null;
  distancia_km: string | null;
  duracion_min: number | null;
  notas: string | null;
};

export type Gasto = {
  id: number;
  categoria: string;
  monto: string;
  fecha_hora: string;
  litros: string | null;
  descripcion: string | null;
};

/** Envíos y gastos de un día puntual (YYYY-MM-DD en hora de BA) */
export async function movimientosDelDia(uid: number, fecha: string) {
  const rango = `fecha_hora >= ($2::date)::timestamp AT TIME ZONE '${TZ}'
             AND fecha_hora <  ($2::date + 1)::timestamp AT TIME ZONE '${TZ}'`;
  const [envios, gastos] = await Promise.all([
    query<Envio>(
      `SELECT id, plataforma, medio_pago, monto, fecha_hora, origen, destino, distancia_km, duracion_min, notas
       FROM envios WHERE usuario_id = $1 AND ${rango} ORDER BY fecha_hora DESC, id DESC`,
      [uid, fecha],
    ),
    query<Gasto>(
      `SELECT id, categoria, monto, fecha_hora, litros, descripcion
       FROM gastos WHERE usuario_id = $1 AND ${rango} ORDER BY fecha_hora DESC, id DESC`,
      [uid, fecha],
    ),
  ]);
  return { envios, gastos };
}

export type FilaMapa = {
  monto: string;
  origen_lat: number | null;
  origen_lng: number | null;
  origen_barrio: string | null;
  destino_lat: number | null;
  destino_lng: number | null;
  destino_barrio: string | null;
  sin_ubicar: boolean;
  con_direccion: boolean;
};

/** Envíos del período con sus coordenadas, para el mapa de zonas */
export async function enviosParaMapa(uid: number, periodo: Periodo, n = 0) {
  const filas = await query<FilaMapa & { desde: string; hasta: string }>(
    `WITH ${RANGO}
     SELECT e.monto, e.origen_lat, e.origen_lng, e.origen_barrio, e.destino_lat, e.destino_lng, e.destino_barrio,
            ((e.origen IS NOT NULL AND e.origen_lat IS NULL) OR (e.destino IS NOT NULL AND e.destino_lat IS NULL)) AS sin_ubicar,
            (e.origen IS NOT NULL OR e.destino IS NOT NULL) AS con_direccion
     FROM envios e, r
     WHERE e.usuario_id = $1 AND e.fecha_hora >= r.desde AND e.fecha_hora < r.hasta`,
    [uid, UNIDAD[periodo], String(n)],
  );
  const [rango] = await query<{ desde: string; hasta: string }>(
    `WITH ${RANGO} SELECT to_char(r.desde AT TIME ZONE '${TZ}', 'YYYY-MM-DD') AS desde,
            to_char((r.hasta AT TIME ZONE '${TZ}') - interval '1 day', 'YYYY-MM-DD') AS hasta FROM r WHERE $1::int IS NOT NULL`,
    [uid, UNIDAD[periodo], String(n)],
  );
  return { filas, desde: rango.desde, hasta: rango.hasta };
}
