import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                port: "",
                pathname: "/**",
                search: "",
            },
        ],
    },
    output: "export",
    reactStrictMode: true,
};

export default nextConfig;
