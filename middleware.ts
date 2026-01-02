import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'flash_admin_token';

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  matcher: ['/admin/:path*'],
};

