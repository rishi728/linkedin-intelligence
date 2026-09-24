import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the whole app is client-side, so it can be hosted as plain files.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
