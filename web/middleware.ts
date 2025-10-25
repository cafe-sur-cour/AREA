import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get locale from cookie or default to 'en'
  const locale = request.cookies.get('locale')?.value || 'en';
  
  // Set locale header for next-intl
  const response = NextResponse.next();
  response.headers.set('x-locale', locale);
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
