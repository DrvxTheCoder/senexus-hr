import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect root dashboard to select-firm
    if (path === '/dashboard' || path.startsWith('/dashboard/')) {
      return NextResponse.redirect(new URL('/select-firm', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/:firmSlug/dashboard/:path*',
    '/select-firm'
  ]
};
