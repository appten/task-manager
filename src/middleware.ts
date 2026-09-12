import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Pengguna hanya boleh akses jika memiliki token session valid
        return !!token;
      },
    },
    pages: {
      signIn: '/api/auth/signin', // Dialihkan ke login NextAuth jika belum login
    },
  }
);

// Lindungi rute /dashboard
export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
};
