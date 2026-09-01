import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@vercel/blob",
    "undici",
    "cloudinary",
    "firebase-admin",
  ],
};

export default nextConfig;