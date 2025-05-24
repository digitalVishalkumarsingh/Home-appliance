// middleware.tsx
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, getTokenFromRequest, JwtPayload } from "./app/lib/auth";
import { logger } from "./app/config/logger";

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    // Define public paths
    const isPublicPath =
      path === "/login" ||
      path === "/signup" ||
      path === "/admin/login" ||
      path === "/admin/signup" ||
      path === "/" ||
      path === "/about" ||
      path === "/contact" ||
      path === "/services" ||
      path === "/booking-instructions" ||
      path.startsWith("/servicedetails/") ||
      path.startsWith("/_next/") ||
      path.startsWith("/images/") ||
      path.match(/\.(webp|svg|png|jpg|jpeg)$/) ||
      path.startsWith("/api/auth/login") ||
      path.startsWith("/api/auth/signup") ||
      path.startsWith("/api/auth/admin-signup") ||
      path.startsWith("/api/services") ||
      path.startsWith("/api/contact");

    const isAdminPath = path.startsWith("/admin");
    const isTechnicianPath = path.startsWith("/technician");
    const isProtectedApiPath =
      path === "/api/auth/me" ||
      path.startsWith("/api/admin/") ||
      path.startsWith("/api/user/") ||
      path.startsWith("/api/technician/");

    if (isPublicPath) {
      logger?.debug?.("Allowing public path", { path }) ?? console.debug("Allowing public path", { path });
      return NextResponse.next();
    }

    let token: string;
    try {
      token = getTokenFromRequest(request);
      console.log("Middleware - Token found in request", {
        path,
        hasToken: !!token,
        tokenLength: token?.length,
        tokenStart: token ? token.substring(0, 20) + '...' : 'none'
      });
      logger?.debug?.("Token found in request", { path, hasToken: !!token, tokenLength: token?.length }) ?? console.debug("Token found in request", { path, hasToken: !!token, tokenLength: token?.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const cookieHeader = request.headers.get('cookie');
      const authHeader = request.headers.get('authorization');

      console.log("Middleware - No valid token found", {
        path,
        error: errorMessage,
        hasCookieHeader: !!cookieHeader,
        hasAuthHeader: !!authHeader,
        cookieNames: cookieHeader ? cookieHeader.split(';').map(c => c.trim().split('=')[0]) : [],
        fullCookieHeader: cookieHeader ? cookieHeader.substring(0, 200) + '...' : 'none'
      });

      logger?.warn?.("No valid token found", {
        path,
        error: errorMessage,
        hasCookieHeader: !!cookieHeader,
        hasAuthHeader: !!authHeader,
        cookieNames: cookieHeader ? cookieHeader.split(';').map(c => c.trim().split('=')[0]) : []
      }) ?? console.warn("No valid token found", {
        path,
        error: errorMessage,
        hasCookieHeader: !!cookieHeader,
        hasAuthHeader: !!authHeader,
        cookieNames: cookieHeader ? cookieHeader.split(';').map(c => c.trim().split('=')[0]) : []
      });

      if (isProtectedApiPath) {
        return NextResponse.json(
          { success: false, message: "Authentication required" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(
        new URL(isAdminPath ? "/admin/login" : "/login", request.url)
      );
    }

    try {
      const decoded = (await verifyToken(token)) as JwtPayload;

      if (!decoded.userId || !decoded.role) {
        logger?.warn?.("Invalid token payload", { path, userId: decoded.userId }) ?? console.warn("Invalid token payload", { path, userId: decoded.userId });
        if (isProtectedApiPath) {
          return NextResponse.json(
            { success: false, message: "Invalid authentication token" },
            { status: 401 }
          );
        }
        return NextResponse.redirect(
          new URL(isAdminPath ? "/admin/login" : "/login", request.url)
        );
      }

      if (isAdminPath && decoded.role !== "admin") {
        logger?.warn?.("Unauthorized admin access", { path, role: decoded.role, userId: decoded.userId }) ?? console.warn("Unauthorized admin access", { path, role: decoded.role, userId: decoded.userId });
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (isTechnicianPath && decoded.role !== "technician") {
        logger?.warn?.("Unauthorized technician access", { path, role: decoded.role, userId: decoded.userId }) ?? console.warn("Unauthorized technician access", { path, role: decoded.role, userId: decoded.userId });
        return NextResponse.redirect(new URL("/", request.url));
      }

      const isUserSpecificPath =
        path === "/profile" ||
        path.startsWith("/profile/") ||
        path === "/bookings" ||
        path.startsWith("/bookings/") ||
        path === "/orders" ||
        path.startsWith("/orders/") ||
        path === "/saved-services" ||
        path === "/notifications" ||
        path === "/settings" ||
        path === "/support";

      if (isUserSpecificPath && decoded.role === "admin") {
        logger?.debug?.("Redirecting admin from user-specific path", { path, userId: decoded.userId }) ?? console.debug("Redirecting admin from user-specific path", { path, userId: decoded.userId });
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }

      logger?.debug?.("Access granted", { path, role: decoded.role, userId: decoded.userId }) ?? console.debug("Access granted", { path, role: decoded.role, userId: decoded.userId });
      return NextResponse.next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger?.error?.("Token verification failed in middleware", { path, error: errorMessage }) ?? console.error("Token verification failed in middleware", { path, error: errorMessage });
      if (isProtectedApiPath) {
        return NextResponse.json(
          { success: false, message: "Authentication error" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(
        new URL(isAdminPath ? "/admin/login" : "/login", request.url)
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
    logger?.error?.("Middleware error", { path: request.nextUrl.pathname, error: errorMessage, rawError: String(error) }) ?? console.error("Middleware error", { path: request.nextUrl.pathname, error: errorMessage, rawError: String(error) });
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/admin/:path*",
    "/technician/:path*",
    "/bookings/:path*",
    "/orders/:path*",
    "/saved-services",
    "/notifications",
    "/settings",
    "/support",
    "/api/auth/me",
    "/api/admin/:path*",
    "/api/user/:path*",
    "/api/technician/:path*",
  ],
};