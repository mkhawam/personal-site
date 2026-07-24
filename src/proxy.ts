import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: Request) {
    const url = new URL(request.url);
    const origin = url.origin;
    const pathname = url.pathname;
    
    // Auth Middleware for /tasks
    if (pathname.startsWith("/tasks")) {
        const cookies = request.headers.get("cookie") || "";
        // Parse cookies for auth_token
        const token = cookies.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        
        if (!token || !(await verifyToken(token))) {
             return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-url", request.url);
    requestHeaders.set("x-origin", origin);
    requestHeaders.set("x-pathname", pathname);
    // COEP/COOP live in next.config.mjs headers() — they must be RESPONSE
    // headers to isolate the browser; setting them here only forwarded them
    // into the app as request headers, so isolation never took effect.

    const cookies = request.headers.get("cookie") || "";
    const cookieArray = cookies.split("; ");
    const cookieObject: { [key: string]: string } = {};
    for (const cookie of cookieArray) {
        const [key, value] = cookie.split("=");
        cookieObject[key] = value;
    }
    requestHeaders.set("x-theme", cookieObject["theme"] || "midnight");
    // Sidebar state travels the same cookie -> header -> SSR path as the theme, so
    // the layout can render the correct width on the server instead of after hydration.
    requestHeaders.set("x-sidebar", cookieObject["sidebar"] || "open");

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
