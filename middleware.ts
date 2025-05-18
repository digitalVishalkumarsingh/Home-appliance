import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './app/lib/auth-edge';

// Middleware to handle authentication
export async function middleware(request: NextRequest) {
  try {
    // Get the pathname of the request
    const path = request.nextUrl.pathname;

    // Define public paths that don't require authentication
    const isPublicPath =
      path === '/login' ||
      path === '/signup' ||
      path === '/admin/login' ||
      path === '/admin/signup' ||
      path === '/' ||
      path.startsWith('/_next/') ||
      path.startsWith('/static/') ||
      path.startsWith('/about') ||
      path.startsWith('/contact') ||
      path.startsWith('/acrepair') ||
      path.startsWith('/washing-machine-services') ||
      path.includes('.webp') ||
      path.includes('.svg') ||
      path.includes('.png') ||
      path.includes('.jpg') ||
      path.includes('.jpeg') ||
      path.startsWith('/api/auth/login') ||
      path.startsWith('/api/auth/signup') ||
      path.startsWith('/api/auth/admin-signup');

    // Check if the path is for admin routes
    const isAdminPath = path.startsWith('/admin');

    // Check if the path is for protected API routes
    const isProtectedApiPath =
      path === '/api/auth/me' ||
      path.startsWith('/api/admin/') ||
      path.startsWith('/api/user/');

    // If the path is public, allow access immediately
    if (isPublicPath) {
      return NextResponse.next();
    }

    // Get the token from cookies
    const token = request.cookies.get('token')?.value;

    // If no token and trying to access protected route, redirect to login
    if (!token) {
      // For API routes, return 401 Unauthorized
      if (isProtectedApiPath) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }

      // For non-API routes, redirect to appropriate login page
      if (isAdminPath) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Verify the token
    try {
      const decoded = await verifyToken(token);

      // If token is invalid, redirect to login
      if (!decoded) {
        // For API routes, return 401 Unauthorized
        if (isProtectedApiPath) {
          return NextResponse.json(
            { success: false, message: 'Invalid authentication token' },
            { status: 401 }
          );
        }

        // For non-API routes, redirect to appropriate login page
        if (isAdminPath) {
          return NextResponse.redirect(new URL('/admin/login', request.url));
        } else {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }

      // Check if user is trying to access admin routes but is not an admin
      if (isAdminPath && decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // If everything is fine, proceed with the request
      return NextResponse.next();
    } catch (error) {
      console.error('Token verification error:', error);

      // For API routes, return 401 Unauthorized
      if (isProtectedApiPath) {
        return NextResponse.json(
          { success: false, message: 'Authentication error' },
          { status: 401 }
        );
      }

      // For non-API routes, redirect to appropriate login page
      if (isAdminPath) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  } catch (error) {
    // Catch any unexpected errors to prevent middleware from crashing
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Configure the middleware to run on specific routes that need protection
export const config = {
  matcher: [
    // Protected routes
    '/profile/:path*',
    '/admin/:path*',
    '/api/auth/me',
    '/api/admin/:path*',
    '/api/user/:path*',
    // Add other protected routes as needed
  ],
};

