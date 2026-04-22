/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow the v0 preview iframe host to load HMR + RSC payloads in dev.
  // Without this, client JS fails to hydrate and onClick handlers
  // (like "Begin the flow") never fire.
  allowedDevOrigins: ["*.vusercontent.net", "*.vercel.app", "localhost"],
}

export default nextConfig
