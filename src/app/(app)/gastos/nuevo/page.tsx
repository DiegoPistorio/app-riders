import { requerirSesion } from "@/lib/auth";
import { ahoraBA } from "@/lib/formato";
import FormGasto from "./FormGasto";

export const dynamic = "force-dynamic";

export default async function NuevoGasto() {
  await requerirSesion();
  const { fecha, hora } = ahoraBA();
  return (
    <>
      <h1 className="mb-5 text-xl font-bold">Cargar gasto</h1>
      <FormGasto fecha={fecha} hora={hora} />
    </>
  );
}
