import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from './lib/session';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`[Proxy] Pathname: ${pathname}`);

  // Helper to return redirect response with no-store cache headers to prevent browser redirect caching
  const redirectNoCache = (url: URL | string) => {
    const targetUrl = typeof url === 'string' ? url : url.toString();
    console.log(`[Proxy] Redirecting ${pathname} -> ${targetUrl}`);
    const response = NextResponse.redirect(typeof url === 'string' ? new URL(url, req.url) : url);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  };

  // 1. Bypass login paths, static files, APIs, and the blocked page
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/worker/login') ||
    pathname.startsWith('/customer/login') ||
    pathname.startsWith('/blocked') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.webmanifest') ||
    pathname.startsWith('/api')
  ) {
    console.log(`[Proxy] Bypassing path: ${pathname}`);
    return NextResponse.next();
  }

  // 2. Read session cookie
  const sessionToken = req.cookies.get('volo_session')?.value;
  console.log(`[Proxy] Session cookie present: ${!!sessionToken}`);

  // 3. Handle unauthenticated requests
  if (!sessionToken) {
    console.log(`[Proxy] Unauthenticated request to ${pathname}`);
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
      );
    }
    if (pathname.startsWith('/admin')) {
      return redirectNoCache(new URL('/admin/login', req.url));
    }
    if (pathname.startsWith('/worker')) {
      return redirectNoCache(new URL('/worker/login', req.url));
    }
    if (pathname.startsWith('/customer')) {
      return redirectNoCache(new URL('/customer/login', req.url));
    }
    return NextResponse.next();
  }

  // 4. Verify Session Payload
  const session = await verifySessionCookie(sessionToken);
  console.log(`[Proxy] Session verification result:`, session);

  if (!session) {
    console.log(`[Proxy] Invalid session token for ${pathname}`);
    if (pathname.startsWith('/api')) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
      );
      response.cookies.delete('volo_session');
      return response;
    }
    const redirectUrl = pathname.startsWith('/admin')
      ? '/admin/login'
      : pathname.startsWith('/worker')
      ? '/worker/login'
      : '/customer/login';

    const response = redirectNoCache(new URL(redirectUrl, req.url));
    response.cookies.delete('volo_session');
    return response;
  }

  // 5. Role validation & routing redirection
  const { role } = session;
  console.log(`[Proxy] User Role: ${role}`);

  if (pathname.startsWith('/api')) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403, headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
    );
  }

  if (pathname.startsWith('/admin') && role !== 'admin') {
    const fallback = role === 'worker' ? '/worker/dashboard' : '/customer/dashboard';
    return redirectNoCache(new URL(fallback, req.url));
  }

  if (pathname.startsWith('/worker') && role !== 'worker') {
    const fallback = role === 'admin' ? '/admin/dashboard' : '/customer/dashboard';
    return redirectNoCache(new URL(fallback, req.url));
  }

  if (pathname.startsWith('/customer') && role !== 'customer') {
    const fallback = role === 'admin' ? '/admin/dashboard' : '/worker/dashboard';
    return redirectNoCache(new URL(fallback, req.url));
  }

  console.log(`[Proxy] Allowed path: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/worker/:path*',
    '/customer/:path*',
    '/api/:path*'
  ]
};

