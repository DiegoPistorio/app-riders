# App Riders — Control de Ganancias para Repartidores

PWA para repartidores en moto (pensada a partir de Cabify Envíos) que responde la pregunta más importante al terminar el día: **¿dónde está la plata?**

---

## Qué registra

| Concepto | Qué significa |
|---|---|
| **Por app** | Lo cobrado por la app con tarjeta — pendiente de depósito |
| **Efectivo de la app** | Envíos de la app cobrados en efectivo |
| **Particulares** | Envíos por fuera de la app (efectivo o transferencia) |
| **Gastos** | Nafta, comida, mantenimiento, seguro, celular |
| **Neto real** | Total ganado − gastos |
| **Plata en mano** | Todo el efectivo cobrado − gastos |
| **Zonas calientes** | Mapa de calor y ranking de barrios por envíos o ganancias |

Las semanas van de lunes a domingo. Todo se calcula en hora de Buenos Aires.

## Funcionalidades

- **Resumen diario / semanal / mensual** — totales y desglose de un vistazo
- **Carga manual** — optimizada para celular, funciona offline
- **Historial de envíos** — registro completo con borrado por día
- **Registro de gastos** — por categoría (nafta, comida, mantenimiento, seguro, celular)
- **Mapa de zonas calientes** — Leaflet con autocompletado de barrios (OpenStreetMap / Nominatim — sin API key)
- **PWA instalable** — se agrega a la pantalla de inicio desde el navegador

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | PostgreSQL |
| Mapas | Leaflet + OpenStreetMap (Nominatim) |
| Contenedores | Docker |

## Correr en local (WSL)

```bash
cp .env.example .env.local   # completar AUTH_SECRET (openssl rand -base64 32)
docker compose up -d db      # Postgres con las tablas ya creadas
npm install
npm run dev                  # http://localhost:3000
```

> Si ya tenías la base de una versión anterior, reseteala (las tablas cambiaron):
> ```bash
> docker compose down -v && docker compose up -d db
> ```

## Deploy en Coolify

1. En el proyecto de Coolify, agregá un recurso **PostgreSQL** y copiá su URL interna.
2. Agregá la app desde GitHub (`DiegoPistorio/app-riders`, rama `main`). Build pack: **Dockerfile**. Puerto: **3000**.
3. Cargá las variables de entorno:
   - `DATABASE_URL` — URL interna del paso 1
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `GEOCODE_CIUDAD` — ej. `Buenos Aires`
4. Deploy. Al arrancar, el contenedor crea las tablas solo (`scripts/db-init.mjs`).

## Estructura del proyecto

```
db/schema.sql              tablas: usuarios, envíos, gastos, geocache
scripts/db-init.mjs        crea las tablas si no existen
src/lib/datos.ts           consultas del resumen, historial y mapa
src/lib/geocode.ts         dirección → coordenadas y barrio (con caché)
src/app/(publico)/         login y registro
src/app/(app)/page.tsx     resumen día / semana / mes
src/app/(app)/envios/nuevo carga de envío
src/app/(app)/gastos/nuevo carga de gasto
src/app/(app)/historial    movimientos por día (con borrar)
src/app/(app)/mapa         zonas calientes
```

## Cómo se calcula

| Concepto | Fórmula |
|---|---|
| Por app | Envíos de Cabify u otra app cobrados por la app |
| Efectivo de la app | Envíos de Cabify u otra app cobrados en efectivo |
| Particulares | Envíos particulares (en efectivo o por transferencia) |
| Total ganado | Por app + efectivo de la app + particulares |
| Neto real | Total ganado − gastos |
| Plata en mano | Todo el efectivo cobrado − gastos |

---

Desarrollado por [Diego Pistorio](https://github.com/DiegoPistorio)
