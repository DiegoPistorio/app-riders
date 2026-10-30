// Crea las tablas si no existen. Lo usa el contenedor de producción al arrancar,
// y también se puede correr a mano: npm run db:init
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "db", "schema.sql"), "utf8");
const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log("Esquema OK");
} catch (e) {
  console.error("Error creando el esquema:", e.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
