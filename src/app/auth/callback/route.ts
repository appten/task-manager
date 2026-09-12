import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Teruskan query parameter (code, state, dll) ke handler NextAuth TEN
  const forwardUrl = new URL(`${origin}/api/auth/callback/ten`);
  searchParams.forEach((value, key) => {
    forwardUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(forwardUrl);
}
