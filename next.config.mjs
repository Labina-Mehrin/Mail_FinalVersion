// Using process.cwd() since this config runs in Node ESM context

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
  },
  // Ensure Next.js uses this workspace as the root for output tracing
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
