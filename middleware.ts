import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/analytics',
  '/planner',
  '/settings',
  '/track',
  '/focus',
  '/preparation',
]

// Routes that should redirect to home if already authenticated
const AUTH_ROUTES = [
  '/auth',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Static files and Next.js internals - allow
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Create a Supabase client configured to use cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  // Verify environment variables - allow access if not configured (dev mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration')
    return NextResponse.next()
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get the session
  const { data: { session } } = await supabase.auth.getSession()

  // Check if current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  // Check if current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Redirect to auth if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Optionally: redirect to home if accessing auth routes while logged in
  if (isAuthRoute && session && !pathname.includes('/callback')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
