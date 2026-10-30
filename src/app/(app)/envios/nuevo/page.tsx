import { requerirSesion } from "@/lib/auth";
import { ahoraBA } from "@/lib/formato";
import FormEnvio from "./FormEnvio";

export const dynamic = "force-dynamic";

export default async function NuevoEnvio() {
  await requerirSesion();
  const { fecha, hora } = ahoraBA();
  return (
    <>
      <h1 className="mb-5 text-xl font-bold">Cargar envío</h1>
      <FormEnvio fecha={fecha} hora={hora} />
    </>
  );
}
