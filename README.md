# App Riders

App para repartidores en moto (pensada a partir de Cabify Envíos) que muestra,
al final del día, **dónde está la plata**:

- **Por app**: lo que cobró la app con tarjeta y te va a depositar.
- **Efectivo**: lo que ya tenés en la mano.
- **Particulares**: envíos por fuera de la app.
- **Gastos**: nafta, comida y bebida, mantenimiento, seguro, celular.
- **Neto real** y **plata en mano**: efectivo cobrado menos gastos.
- **Zonas calientes**: mapa de calor y ranking de barrios con más envíos o más plata.

Carga 100% manual, pensada para el celular (se instala como app desde el navegador).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind 4 · PostgreSQL · Leaflet.
Para el mapa, las direcciones se ubican con OpenStreetMap (Nominatim): es gratis
y no necesita clave.

## Correr en tu PC (WSL)

```bash
cp .env.example .env.local        # y completá AUTH_SECRET (openssl rand -base64 32)
docker compose up -d db           # Postgres con las tablas ya creadas
npm install
npm run dev                       # http://localhost:3000
```

Si ya tenías la base de la versión anterior, reseteala, porque las tablas cambiaron:

```bash
docker compose down -v && docker compose up -d db
```

## Deploy en Coolify

1. En el proyecto de Coolify, agregá un recurso **PostgreSQL** y copiá su URL interna.
2. Agregá la app desde GitHub (`DiegoPistorio/app-riders`, rama `main`).
   - **Build pack: Dockerfile**.
   - Puerto: **3000**.
3. Cargá las variables de entorno:
   - `DATABASE_URL`: la URL interna del paso 1.
   - `AUTH_SECRET`: una clave nueva (`openssl rand -base64 32`).
   - `GEOCODE_CIUDAD`: `Buenos Aires`.
4. Deploy. Al arrancar, el contenedor crea las tablas solo (`scripts/db-init.mjs`).

## Estructura

```
db/schema.sql                 tablas (usuarios, envios, gastos, geocache)
scripts/db-init.mjs           crea las tablas si no existen
src/lib/datos.ts              consultas del resumen, historial y mapa
src/lib/geocode.ts            dirección → coordenadas y barrio (con caché)
src/app/(publico)/            login y registro
src/app/(app)/page.tsx        resumen día / semana / mes
src/app/(app)/envios/nuevo    carga de envío
src/app/(app)/gastos/nuevo    carga de gasto
src/app/(app)/historial       movimientos por día (con borrar)
src/app/(app)/mapa            zonas calientes
```

## Cómo se calcula

| Concepto | Fórmula |
|---|---|
| Por app | envíos de Cabify u otra app cobrados por la app |
| Efectivo de la app | envíos de Cabify u otra app cobrados en efectivo |
| Particulares | envíos particulares (en efectivo o por transferencia) |
| Total ganado | por app + efectivo de la app + particulares |
| Neto real | total ganado − gastos |
| Plata en mano | todo el efectivo cobrado − gastos |

Las semanas van de lunes a domingo, igual que en Cabify. Todo se calcula en hora
de Buenos Aires.
