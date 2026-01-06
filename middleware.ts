import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'flash_admin_token';

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') ?? '';

  // Canonical host: Vercel is currently serving www as primary (apex redirects to www).
  // Enforce apex -> www at the app layer too, to keep Search Console/indexing consistent.
  // Only apply on production hosts to avoid breaking preview deployments.
  if (host === 'fl4shcards.com') {
    const url = req.nextUrl.clone();
    url.host = 'www.fl4shcards.com';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  // Allow login page (and Next internals)
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) return NextResponse.next();

  if (isAdminPath(pathname)) {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      // keep a return param for future enhancement
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything so we can enforce canonical host, plus admin auth.
  matcher: ['/:path*'],
};

