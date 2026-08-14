import type { Metadata } from "next";
import { Inter, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pharmatrack.co"),
  title: {
    default: "PharmaTrack — Recordatorios de adherencia para farmacias",
    template: "%s — PharmaTrack",
  },
  description:
    "Automatiza los recordatorios de tus pacientes crónicos. Recupera la venta recurrente que tu farmacia pierde cada mes sin darte cuenta. 2 semanas gratis, sin compromiso.",
  keywords: [
    "recordatorios farmacia",
    "pacientes crónicos",
    "adherencia terapéutica",
    "fidelización farmacia",
    "software farmacia",
    "recurrencia farmacia",
  ],
  openGraph: {
    title: "PharmaTrack — Vuelven a tu mostrador",
    description:
      "Recordatorios automáticos que estabilizan los ingresos de tu farmacia. 2 semanas gratis, sin compromiso.",
    url: "https://pharmatrack.co",
    siteName: "PharmaTrack",
    locale: "es_CO",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${manrope.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-forest-ink font-sans">
        {children}
      </body>
    </html>
  );
}
