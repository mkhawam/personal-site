/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                pathname: "/**",
            },
        ],
    },
    async redirects() {
        return [
            {
                // Slug used to carry a typo ("amoung"); keep old links working.
                source: "/blog/post/the_imposter_amoung_us",
                destination: "/blog/post/the_imposter_among_us",
                permanent: true,
            },
            // The one-page redesign folded these routes into home-page sections.
            // Exact-match sources: /blog/post/* is untouched. Temporary (307)
            // until the new layout settles, then flip to permanent.
            { source: "/projects", destination: "/#work", permanent: false },
            { source: "/blog", destination: "/#blog", permanent: false },
            // The CV used to hide behind the 404 shell; recruiters get the PDF.
            { source: "/cv", destination: "/scripts/resume.pdf", permanent: false },
        ];
    },
    async headers() {
        // Cross-origin isolation is required for SharedArrayBuffer, which
        // WebContainer (the /playground runtime) depends on. These MUST be
        // response headers on every route — including /_next static assets —
        // so they live here rather than in proxy.ts. `credentialless` enables
        // isolation without demanding a CORP header on every cross-origin
        // subresource (GitHub avatars etc. still load).
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                ],
            },
        ];
    },
};

export default nextConfig;
