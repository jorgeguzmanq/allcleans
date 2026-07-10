import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { CollectionBar } from "@/components/collection/collection-bar";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-ans",
});

export const metadata: Metadata = {
  title: "All Cleans -配方管理平台",
  description: "Plataforma para配方管理 de productos químicos de limpieza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${fontSans.variable} antialiased`}>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary">All Cleans</h1>
                <nav className="flex gap-6">
                  <Link href="/" className="text-foreground hover:text-primary transition-colors">
                    Inicio
                  </Link>
                  <Link href="/ingredientes" className="text-foreground hover:text-primary transition-colors">
                    Ingredientes
                  </Link>
                  <Link href="/recetas" className="text-foreground hover:text-primary transition-colors">
                    Recetas
                  </Link>
                  <Link href="/produccion" className="text-foreground hover:text-primary transition-colors">
                    Producción
                  </Link>
                  <Link href="/historial" className="text-foreground hover:text-primary transition-colors">
                    Historial
                  </Link>
                </nav>
                <CollectionBar />
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}