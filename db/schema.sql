-- App Riders — esquema inicial (MVP híbrido)
-- Requiere PostgreSQL 13+ (gen_random_uuid() es nativo desde esa versión).

CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehiculos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('moto', 'auto', 'bicicleta', 'bicicleta_electrica')),
  marca         TEXT,
  modelo        TEXT,
  km_por_litro  NUMERIC(6,2),
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_vehiculos_usuario ON vehiculos(usuario_id);

CREATE TABLE plataformas (
  id    SMALLSERIAL PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

INSERT INTO plataformas (slug, nombre) VALUES
  ('pedidosya', 'PedidosYa'),
  ('rappi',     'Rappi'),
  ('uber',      'Uber'),
  ('didi',      'DiDi'),
  ('cabify',    'Cabify');

-- Horas y km trabajados en una jornada. Opcional: si no se carga, resumen_diario
-- estima las horas a partir del primer y último viaje de ese día.
CREATE TABLE jornadas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  vehiculo_id     UUID REFERENCES vehiculos(id) ON DELETE SET NULL,
  fecha           DATE NOT NULL,
  hora_inicio     TIMESTAMPTZ NOT NULL,
  hora_fin        TIMESTAMPTZ,
  km_recorridos   NUMERIC(8,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_jornadas_usuario_fecha ON jornadas(usuario_id, fecha);

-- Cada captura de pantalla subida. Se guarda la respuesta cruda de la IA para
-- poder reprocesar o auditar sin tener que volver a llamar a la API.
CREATE TABLE importaciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plataforma_id  SMALLINT NOT NULL REFERENCES plataformas(id),
  tipo_captura   TEXT NOT NULL CHECK (tipo_captura IN (
                   'billetera_dia', 'billetera_semana', 'billetera_mes',
                   'detalle_viaje', 'ver_detalles', 'ver_ganancias'
                 )),
  fecha_captura  DATE NOT NULL, -- fecha real del dispositivo al momento de la captura; resuelve "Hoy"/"Ayer"
  imagen_url     TEXT,
  respuesta_ia   JSONB NOT NULL,
  procesado      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_importaciones_usuario ON importaciones(usuario_id);

CREATE TABLE viajes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plataforma_id   SMALLINT NOT NULL REFERENCES plataformas(id),
  importacion_id  UUID REFERENCES importaciones(id) ON DELETE SET NULL, -- null si se cargó a mano
  jornada_id      UUID REFERENCES jornadas(id) ON DELETE SET NULL,
  origen_dato     TEXT NOT NULL CHECK (origen_dato IN ('manual', 'captura')),
  fecha           TIMESTAMPTZ NOT NULL,
  monto_rider     NUMERIC(10,2) NOT NULL, -- lo que efectivamente le queda al rider
  tarifa          NUMERIC(10,2),
  comision        NUMERIC(10,2),
  propina         NUMERIC(10,2),
  categoria       TEXT, -- ej: "Envíos en moto"
  origen_texto    TEXT,
  destino_texto   TEXT,
  paradas_texto   TEXT,
  origen_lat      NUMERIC(9,6), -- fase 2: mapa de calor
  origen_lng      NUMERIC(9,6),
  destino_lat     NUMERIC(9,6),
  destino_lng     NUMERIC(9,6),
  duracion_minutos INTEGER,
  distancia_km    NUMERIC(6,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_viajes_usuario_fecha ON viajes(usuario_id, fecha);
CREATE INDEX ix_viajes_importacion ON viajes(importacion_id);

-- Evita duplicar el mismo viaje cuando se sube más de una captura que lo incluye
-- (ej: la lista del día y el detalle de un viaje puntual).
CREATE UNIQUE INDEX uq_viaje_dedupe ON viajes(usuario_id, plataforma_id, fecha, monto_rider);

-- Totales que la plataforma muestra agregados (billetera día/semana/mes) cuando
-- no se cargan los viajes uno por uno. Se guarda aparte de `viajes` a propósito:
-- mezclarlos en el mismo total arriesgaría contar dos veces el mismo ingreso
-- si el rider sube la captura de la billetera Y la lista de viajes del mismo período.
CREATE TABLE resumenes_plataforma (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plataforma_id   SMALLINT NOT NULL REFERENCES plataformas(id),
  importacion_id  UUID REFERENCES importaciones(id) ON DELETE SET NULL,
  periodo         TEXT NOT NULL CHECK (periodo IN ('dia', 'semana', 'mes')),
  fecha_desde     DATE NOT NULL,
  fecha_hasta     DATE NOT NULL,
  ingreso_total   NUMERIC(10,2) NOT NULL,
  cantidad_viajes INTEGER NOT NULL,
  promedio_viaje  NUMERIC(10,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, plataforma_id, periodo, fecha_desde, fecha_hasta)
);

CREATE TABLE gastos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  vehiculo_id UUID REFERENCES vehiculos(id) ON DELETE SET NULL,
  categoria   TEXT NOT NULL CHECK (categoria IN (
                'nafta', 'mantenimiento', 'seguro', 'patente', 'alquiler', 'otro'
              )),
  fecha       DATE NOT NULL,
  monto       NUMERIC(10,2) NOT NULL,
  litros      NUMERIC(6,2),   -- solo aplica a categoria = 'nafta'
  odometro    NUMERIC(9,1),
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_gastos_usuario_fecha ON gastos(usuario_id, fecha);

-- Resumen por día: ingreso y cantidad de viajes vienen de `viajes` (no de
-- resumenes_plataforma, para no duplicar). Si no hay jornada cargada ese día,
-- las horas se estiman entre el primer y el último viaje registrado.
CREATE VIEW resumen_diario AS
SELECT
  v.usuario_id,
  v.fecha::date AS fecha,
  COUNT(*)                         AS cantidad_viajes,
  SUM(v.monto_rider)               AS ingreso_bruto,
  COALESCE(g.gastos_total, 0)      AS gastos_total,
  SUM(v.monto_rider) - COALESCE(g.gastos_total, 0) AS neto,
  COALESCE(j.horas_trabajadas, horas_estimadas.horas) AS horas_trabajadas,
  CASE
    WHEN COALESCE(j.horas_trabajadas, horas_estimadas.horas) > 0
      THEN (SUM(v.monto_rider) - COALESCE(g.gastos_total, 0))
           / COALESCE(j.horas_trabajadas, horas_estimadas.horas)
    ELSE NULL
  END AS neto_por_hora
FROM viajes v
LEFT JOIN LATERAL (
  SELECT EXTRACT(EPOCH FROM (MAX(v2.fecha) - MIN(v2.fecha))) / 3600.0 AS horas
  FROM viajes v2
  WHERE v2.usuario_id = v.usuario_id AND v2.fecha::date = v.fecha::date
) horas_estimadas ON true
LEFT JOIN (
  SELECT usuario_id, fecha, SUM(monto) AS gastos_total
  FROM gastos
  GROUP BY usuario_id, fecha
) g ON g.usuario_id = v.usuario_id AND g.fecha = v.fecha::date
LEFT JOIN (
  SELECT usuario_id, fecha,
         SUM(EXTRACT(EPOCH FROM (COALESCE(hora_fin, now()) - hora_inicio)) / 3600.0) AS horas_trabajadas
  FROM jornadas
  GROUP BY usuario_id, fecha
) j ON j.usuario_id = v.usuario_id AND j.fecha = v.fecha::date
GROUP BY v.usuario_id, v.fecha::date, g.gastos_total, j.horas_trabajadas, horas_estimadas.horas;
