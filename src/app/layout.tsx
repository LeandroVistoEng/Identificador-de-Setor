import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Identificação de Setor Censitário - Rio de Janeiro",
  description: "Ferramenta para identificar códigos de setores censitários do IBGE no Estado do Rio de Janeiro a partir de endereços ou coordenadas geográficas.",
  keywords: ["Setor Censitário", "IBGE", "Rio de Janeiro", "Geocodificação", "Endereços", "Coordenadas", "Brasil"],
  authors: [{ name: "Setor Censitário RJ" }],
  openGraph: {
    title: "Sistema de Identificação de Setor Censitário",
    description: "Identificação de códigos de setores censitários no Estado do Rio de Janeiro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de Identificação de Setor Censitário",
    description: "Identificação de códigos de setores censitários no Estado do Rio de Janeiro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
