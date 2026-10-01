import "./globals.css";
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Plataforma de Cursos",
  description: "Aprenda com os melhores cursos online",
};

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`min-h-screen font-sans antialiased ${bebas.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
