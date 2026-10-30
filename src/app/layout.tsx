import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css"; // estilos del mapa (cargados acá para que no pisen los de la app)
import "./globals.css";

export const metadata: Metadata = {
  title: "App Riders",
  description: "Tus envíos, tu plata y tus zonas, claros al final del día.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Riders", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
