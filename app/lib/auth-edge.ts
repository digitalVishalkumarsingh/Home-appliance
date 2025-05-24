import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "./auth";
import { logger } from "../config/logger";

export async function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      logger.debug("No token found in request cookies");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const user = await getUserFromToken(token);
    logger.debug("User authenticated in middleware", { userId: user.userId });

    // Add user data to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.userId);
    requestHeaders.set("x-user-role", user.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Middleware authentication failed", { error: errorMessage });
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {

  matcher: ["/dashboard/:path*"], // Protect dashboard routes
};