import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import {
  SESSION_COOKIE,
  cookieOptions,
  shouldSlide,
  signSession,
  verifySession,
} from './app/lib/auth';

const intl = createIntlMiddleware(routing);

const UI_EXEMPT = new Set(['/admin/login']);
const API_EXEMPT = new Set(['/api/admin/login', '/api/admin/logout']);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function resolveAllowedOrigin(origin: string | null): string | null {
  if (!origin || ALLOWED_ORIGINS.length === 0) return null;
  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return null;
  }
  for (const entry of ALLOWED_ORIGINS) {
    if (hostname === entry || hostname.endsWith(`.${entry}`)) {
      return origin;
    }
  }
  return null;
}

function applyCorsHeaders(res: NextResponse, allowedOrigin: string): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  res.headers.set('Vary', 'Origin');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

async function guardUi(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (UI_EXEMPT.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const decoded = token ? await verifySession(token) : null;
  if (!decoded) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  if (shouldSlide(decoded)) {
    const fresh = await signSession({ sub: decoded.sub, email: decoded.email });
    res.cookies.set(SESSION_COOKIE, fresh, cookieOptions());
  }
  return res;
}

async function guardApi(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (API_EXEMPT.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const decoded = token ? await verifySession(token) : null;
  if (!decoded) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const res = NextResponse.next();
  if (shouldSlide(decoded)) {
    const fresh = await signSession({ sub: decoded.sub, email: decoded.email });
    res.cookies.set(SESSION_COOKIE, fresh, cookieOptions());
  }
  return res;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin')) {
    const allowedOrigin = resolveAllowedOrigin(request.headers.get('origin'));
    if (request.method === 'OPTIONS') {
      const preflight = new NextResponse(null, { status: 204 });
      return allowedOrigin ? applyCorsHeaders(preflight, allowedOrigin) : preflight;
    }
    const res = NextResponse.next();
    return allowedOrigin ? applyCorsHeaders(res, allowedOrigin) : res;
  }

  if (pathname.startsWith('/admin')) return guardUi(request);
  if (pathname.startsWith('/api/admin')) return guardApi(request);
  return intl(request);
}

export const config = {
  matcher: ['/', '/(lo|en)/:path*', '/admin/:path*', '/api/:path*'],
};
