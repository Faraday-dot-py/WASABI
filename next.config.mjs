import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  // Allow the v0 preview iframe host to load HMR + RSC payloads in dev.
  // Without this, client JS fails to hydrate and onClick handlers
  // (like "Begin the flow") never fire.
  allowedDevOrigins: ["*.vusercontent.net", "*.vercel.app", "localhost"],
}

export default nextConfig
