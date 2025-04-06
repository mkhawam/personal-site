import { NextResponse } from "next/server";

export function middleware(request: Request) {
    const url = new URL(request.url);
    const origin = url.origin;
    const pathname = url.pathname;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-url", request.url);
    requestHeaders.set("x-origin", origin);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
    requestHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

    const cookies = request.headers.get("cookie") || "";
    const cookieArray = cookies.split("; ");
    const cookieObject: { [key: string]: string } = {};
    for (const cookie of cookieArray) {
        const [key, value] = cookie.split("=");
        cookieObject[key] = value;
    }
    requestHeaders.set("x-theme", cookieObject["theme"] || "cupcake");

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
