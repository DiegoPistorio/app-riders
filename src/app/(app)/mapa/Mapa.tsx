"use client";

import dynamic from "next/dynamic";
import type { PuntoCalor } from "@/components/MapaCalor";

// Leaflet usa window: se carga solo en el navegador
const MapaCalor = dynamic(() => import("@/components/MapaCalor"), {
  ssr: false,
  loading: () => <div className="h-[55dvh] w-full animate-pulse rounded-2xl border border-borde bg-panel" />,
});

export default function Mapa({ puntos }: { puntos: PuntoCalor[] }) {
  return <MapaCalor puntos={puntos} />;
}
