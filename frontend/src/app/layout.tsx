import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PRODIS GPS - Suivi en Temps Réel',
  description: 'Application de suivi GPS pour suivre la position des utilisateurs en temps réel',
  manifest: '/manifest.json',
  themeColor: '#0b2c5e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PRODIS GPS',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
