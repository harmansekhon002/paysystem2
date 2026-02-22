import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Do not ignore build errors in production
  },
  images: {
    unoptimized: false, // Optimize images for production
  },
  reactStrictMode: true, // Enable React strict mode
    // swcMinify: true, // Enable SWC minification (removed, not supported)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    // Add more environment variables as needed
  },
  // Future-proof: Enable experimental features if needed
  // experimental: {
  //   appDir: true,
  // },
}

export default withBundleAnalyzer(nextConfig)
