import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

// ============================================================================
// Routes Configuration
// ============================================================================

/** Routes that require authentication */
const PROTECTED_ROUTES = ["/onboarding", "/profile", "/admin"];

/** Routes only accessible when NOT logged in */
const AUTH_ROUTES = ["/login", "/signup"];

/** Admin-only routes */
const ADMIN_ROUTES = ["/admin"];

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response to pass to Supabase (for cookie forwarding)
  const response = NextResponse.next({ request });

  const supabase = createSupabaseMiddlewareClient(request, response);

  // Refresh the session — IMPORTANT: must be called before getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  // ── Auth routes: redirect logged-in users to dashboard ──────────────
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // ── Protected routes: require login ─────────────────────────────────
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── Admin routes: require admin email ───────────────────────────
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
      if (!user.email || !isAdminEmail(user.email)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // ── Onboarding check: if user has completed profile, redirect ──
    // (Skip this check if already on onboarding page)
    if (!pathname.startsWith("/onboarding")) {
      // Profile check happens client-side via the useUserProfile hook
    }
  }

  // ── All other routes (/, /districts/*, /methodology, /api/*) ──────
  // Publicly accessible — no authentication required
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - API routes (/api/*)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
