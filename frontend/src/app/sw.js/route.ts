import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Lire le fichier service worker depuis public
    const swPath = join(process.cwd(), 'public', 'sw.js');
    const swContent = readFileSync(swPath, 'utf-8');

    // Retourner avec les bons headers pour un service worker
    return new NextResponse(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du service worker:', error);
    return new NextResponse('Service Worker not found', { status: 404 });
  }
}

