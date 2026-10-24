import { auth } from "@/auth";
import { cerrarSesion } from "@/lib/actions/logout";
import { obtenerResumenRango, totalizar } from "@/lib/resumen";

const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function TarjetaResumen({
  titulo,
  ingreso,
  gastos,
  neto,
  viajes,
  netoPorHora,
}: {
  titulo: string;
  ingreso: number;
  gastos: number;
  neto: number;
  viajes: number;
  netoPorHora: number | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
      <h2 className="text-sm font-medium text-gray-500">{titulo}</h2>
      <p className="text-3xl font-bold">{formatoMoneda.format(neto)}</p>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <span>Bruto: {formatoMoneda.format(ingreso)}</span>
        <span>Gastos: {formatoMoneda.format(gastos)}</span>
        <span>Viajes: {viajes}</span>
        <span>
          Neto/hora: {netoPorHora !== null ? formatoMoneda.format(netoPorHora) : "—"}
        </span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const usuarioId = session!.user!.id!;

  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const haceSeisDiasDate = new Date(ahora);
  haceSeisDiasDate.setDate(haceSeisDiasDate.getDate() - 6);
  const haceSeisDias = haceSeisDiasDate.toISOString().slice(0, 10);

  const filasSemana = await obtenerResumenRango(usuarioId, haceSeisDias, hoy);
  const filaHoy = filasSemana.find((f) => f.fecha === hoy);
  const totalSemana = totalizar(filasSemana);

  return (
    <main className="flex-1 px-4 py-6 max-w-md w-full mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Hola, {session!.user!.name}</h1>
        <form action={cerrarSesion}>
          <button type="submit" className="text-sm text-gray-500 underline">
            Salir
          </button>
        </form>
      </header>

      <TarjetaResumen
        titulo="Hoy"
        ingreso={filaHoy?.ingresoBruto ?? 0}
        gastos={filaHoy?.gastosTotal ?? 0}
        neto={filaHoy?.neto ?? 0}
        viajes={filaHoy?.cantidadViajes ?? 0}
        netoPorHora={filaHoy?.netoPorHora ?? null}
      />

      <TarjetaResumen
        titulo="Últimos 7 días"
        ingreso={totalSemana.ingresoBruto}
        gastos={totalSemana.gastosTotal}
        neto={totalSemana.neto}
        viajes={totalSemana.cantidadViajes}
        netoPorHora={totalSemana.netoPorHora}
      />

      <div className="flex flex-col gap-2">
        <a
          href="/viajes/nuevo"
          className="rounded-md bg-blue-600 px-4 py-3 text-white font-medium text-center"
        >
          Cargar viaje
        </a>
        <a
          href="/gastos/nuevo"
          className="rounded-md border border-gray-300 px-4 py-3 text-center font-medium"
        >
          Cargar gasto
        </a>
      </div>
    </main>
  );
}
