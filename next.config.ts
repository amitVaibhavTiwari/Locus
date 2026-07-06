import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["kysely", "sharp", "web-push"],
};

export default nextConfig;
