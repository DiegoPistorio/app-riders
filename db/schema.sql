-- =====================================================
-- App Riders — esquema (carga manual, foco Cabify + particulares)
-- Idempotente: se puede correr varias veces sin romper nada.
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Envíos / viajes
--   plataforma: cabify | particular | otra
--   medio_pago: app (lo deposita la plataforma) | efectivo (ya lo tenés en mano)
--               | transferencia (particulares que te pagan por transferencia)
CREATE TABLE IF NOT EXISTS envios (
  id              SERIAL PRIMARY KEY,
  usuario_id      INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plataforma      VARCHAR(20) NOT NULL CHECK (plataforma IN ('cabify','particular','otra')),
  medio_pago      VARCHAR(20) NOT NULL CHECK (medio_pago IN ('app','efectivo','transferencia')),
  monto           NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  fecha_hora      TIMESTAMPTZ NOT NULL,
  origen          VARCHAR(200),
  destino         VARCHAR(200),
  origen_lat      DOUBLE PRECISION,
  origen_lng      DOUBLE PRECISION,
  origen_barrio   VARCHAR(100),
  destino_lat     DOUBLE PRECISION,
  destino_lng     DOUBLE PRECISION,
  destino_barrio  VARCHAR(100),
  distancia_km    NUMERIC(6,2),
  duracion_min    INT,
  notas           VARCHAR(300),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_envios_usuario_fecha ON envios (usuario_id, fecha_hora);

-- Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id              SERIAL PRIMARY KEY,
  usuario_id      INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria       VARCHAR(20) NOT NULL CHECK (categoria IN
                  ('combustible','comida','mantenimiento','seguro','celular','otro')),
  monto           NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  fecha_hora      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  litros          NUMERIC(6,2),
  descripcion     VARCHAR(200),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_usuario_fecha ON gastos (usuario_id, fecha_hora);

-- Caché de direcciones ya buscadas en OpenStreetMap (evita repetir consultas)
CREATE TABLE IF NOT EXISTS geocache (
  consulta        VARCHAR(300) PRIMARY KEY,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  barrio          VARCHAR(100),
  encontrado      BOOLEAN NOT NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
