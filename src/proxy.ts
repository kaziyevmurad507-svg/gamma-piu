import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);

// Admin pages are not translated: we only keep the login session fresh (an expired token is renewed here, pages cannot set cookies)
async function refreshSession(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  await db.auth.getUser();
  return res;
}

export function proxy(req: NextRequest) {
  return req.nextUrl.pathname.startsWith('/admin') ? refreshSession(req) : intl(req);
}

export const config = {
  // Skip api, Next internals and files like .png
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
