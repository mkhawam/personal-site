import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_OPTIONS, refreshToken, shouldRefreshToken, verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    const token = request.cookies.get("auth_token")?.value;
    const payload = token ? await verifyToken(token) : null;

    // Auth Middleware for /tasks — expired/absent token goes straight to Discord
    // OAuth (silent re-auth for a logged-in Discord user) and returns to where
    // the user was headed. /login stays as the dead-end for OAuth failures only.
    if (pathname.startsWith("/tasks") && !payload) {
        const loginUrl = new URL("/api/auth/discord/login", request.url);
        loginUrl.searchParams.set("returnTo", pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-url", request.url);
    requestHeaders.set("x-origin", request.nextUrl.origin);
    requestHeaders.set("x-pathname", pathname);
    // COEP/COOP live in next.config.mjs headers() — they must be RESPONSE
    // headers to isolate the browser; setting them here only forwarded them
    // into the app as request headers, so isolation never took effect.

    requestHeaders.set("x-theme", request.cookies.get("theme")?.value || "midnight");
    // Sidebar state travels the same cookie -> header -> SSR path as the theme, so
    // the layout can render the correct width on the server instead of after hydration.
    requestHeaders.set("x-sidebar", request.cookies.get("sidebar")?.value || "open");

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Sliding session: re-issue the cookie once the token's iat is older than the
    // refresh threshold. Applies to API routes too (keeps an open tasks tab alive
    // via its /api/sync polling). /api/auth/* is excluded so the OAuth callback's
    // cookie write and logout's deletion are never raced by a re-issue.
    if (payload && shouldRefreshToken(payload) && !pathname.startsWith("/api/auth")) {
        response.cookies.set("auth_token", await refreshToken(payload), AUTH_COOKIE_OPTIONS);
    }

    return response;
}
