import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  
  // Verify environment variables in production
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

  // Refresh auth cookies if present (do not force auth; app supports anonymous-first)
  await supabase.auth.getSession()

  return response
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/',
    '/analytics/:path*',
    '/planner/:path*',
    '/settings/:path*',
  ],
}
