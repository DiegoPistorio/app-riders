import { pool } from "@/lib/db";

export type FilaResumenDiario = {
  fecha: string;
  cantidadViajes: number;
  ingresoBruto: number;
  gastosTotal: number;
  neto: number;
  horasTrabajadas: number | null;
  netoPorHora: number | null;
};

function mapearFila(row: {
  fecha: string;
  cantidad_viajes: string;
  ingreso_bruto: string;
  gastos_total: string;
  neto: string;
  horas_trabajadas: string | null;
  neto_por_hora: string | null;
}): FilaResumenDiario {
  return {
    fecha: row.fecha,
    cantidadViajes: Number(row.cantidad_viajes),
    ingresoBruto: Number(row.ingreso_bruto),
    gastosTotal: Number(row.gastos_total),
    neto: Number(row.neto),
    horasTrabajadas: row.horas_trabajadas ? Number(row.horas_trabajadas) : null,
    netoPorHora: row.neto_por_hora ? Number(row.neto_por_hora) : null,
  };
}

export async function obtenerResumenRango(
  usuarioId: string,
  desde: string,
  hasta: string
): Promise<FilaResumenDiario[]> {
  const { rows } = await pool.query(
    `SELECT * FROM resumen_diario
     WHERE usuario_id = $1 AND fecha BETWEEN $2 AND $3
     ORDER BY fecha DESC`,
    [usuarioId, desde, hasta]
  );
  return rows.map(mapearFila);
}

export function totalizar(filas: FilaResumenDiario[]) {
  const cantidadViajes = filas.reduce((acc, f) => acc + f.cantidadViajes, 0);
  const ingresoBruto = filas.reduce((acc, f) => acc + f.ingresoBruto, 0);
  const gastosTotal = filas.reduce((acc, f) => acc + f.gastosTotal, 0);
  const neto = filas.reduce((acc, f) => acc + f.neto, 0);
  const horasTrabajadas = filas.reduce((acc, f) => acc + (f.horasTrabajadas ?? 0), 0);
  const netoPorHora = horasTrabajadas > 0 ? neto / horasTrabajadas : null;

  return { cantidadViajes, ingresoBruto, gastosTotal, neto, horasTrabajadas, netoPorHora };
}
