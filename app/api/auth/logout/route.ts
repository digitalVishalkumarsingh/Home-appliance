import { NextRequest, NextResponse } from "next/server";
import { clearTokenCookie } from "@/app/lib/auth";
import { logger } from "@/app/config/logger";

export async function POST(request: NextRequest) {
  try {
    logger.debug("Processing logout request");

    // Clear the authentication cookies
    await clearTokenCookie();

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear all authentication-related cookies
    const cookiesToClear = [
      { name: 'token', httpOnly: true },
      { name: 'auth_token', httpOnly: false },
      { name: 'token_backup', httpOnly: false },
      { name: '__stripe_mid', httpOnly: false },
      { name: '__next_hmr_refresh_hash__', httpOnly: false }
    ];

    cookiesToClear.forEach(({ name, httpOnly }) => {
      // Clear with default settings
      response.cookies.set({
        name,
        value: '',
        path: '/',
        maxAge: 0,
        httpOnly,
        sameSite: 'lax',
      });

      // Clear with domain
      response.cookies.set({
        name,
        value: '',
        path: '/',
        domain: request.nextUrl.hostname,
        maxAge: 0,
        httpOnly,
        sameSite: 'lax',
      });

      // Clear with secure flag for production
      if (process.env.NODE_ENV === 'production') {
        response.cookies.set({
          name,
          value: '',
          path: '/',
          maxAge: 0,
          httpOnly,
          secure: true,
          sameSite: 'lax',
        });
      }
    });

    logger.info("User logged out successfully");

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during logout";
    logger.error("Logout error", { error: errorMessage });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to log out",
      },
      { status: 500 }
    );
  }
}
