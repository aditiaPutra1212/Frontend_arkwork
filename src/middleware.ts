import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ==========================================================
 * VERSI DEBUGGING: Middleware ini dinonaktifkan sementara.
 * Hanya melakukan logging path yang diakses.
 * ==========================================================
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log(`[Middleware DEBUG] Path accessed: ${pathname}`); // Log path

  // Selalu izinkan request lanjut
  return NextResponse.next();
}

// Biarkan matcher asli agar kita tahu kapan middleware ini seharusnya berjalan
export const config = {
  matcher: ['/admin/:path*'],
};