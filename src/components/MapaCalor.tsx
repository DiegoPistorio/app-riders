"use client";

import { useEffect, useRef } from "react";

export type PuntoCalor = { lat: number; lng: number; peso: number };

// Centro por defecto: CABA
const CENTRO: [number, number] = [-34.6037, -58.3816];

export default function MapaCalor({ puntos }: { puntos: PuntoCalor[] }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mapa: import("leaflet").Map | null = null;
    let cancelado = false;

    (async () => {
      const L = (await import("leaflet")).default;
      // leaflet.heat se engancha al L global
      (window as unknown as { L: typeof L }).L = L;
      await import("leaflet.heat");
      if (cancelado || !contenedor.current) return;

      mapa = L.map(contenedor.current, { zoomControl: true, attributionControl: true }).setView(CENTRO, 12);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(mapa);

      if (puntos.length) {
        const max = Math.max(...puntos.map((p) => p.peso));
        const heat = (L as unknown as {
          heatLayer: (p: [number, number, number][], o: Record<string, unknown>) => import("leaflet").Layer;
        }).heatLayer(
          puntos.map((p) => [p.lat, p.lng, p.peso / max]),
          { radius: 28, blur: 22, minOpacity: 0.35, maxZoom: 16, gradient: { 0.2: "#3b82f6", 0.45: "#22d3ee", 0.65: "#facc15", 0.85: "#f97316", 1: "#ef4444" } },
        );
        heat.addTo(mapa);
        for (const p of puntos) {
          L.circleMarker([p.lat, p.lng], { radius: 3, color: "#fff", weight: 1, fillOpacity: 0.8, opacity: 0.6 }).addTo(mapa);
        }
        const bounds = L.latLngBounds(puntos.map((p) => [p.lat, p.lng] as [number, number]));
        mapa.fitBounds(bounds.pad(0.2), { maxZoom: 15 });
      }
    })();

    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, [puntos]);

  return <div ref={contenedor} className="h-[55dvh] w-full overflow-hidden rounded-2xl border border-borde" />;
}
