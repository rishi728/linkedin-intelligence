import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import type { NextConfig } from "next";

// Offline support. The service worker is copied to public/sw.js with a version that changes on every
// deploy (the commit on Vercel), so returning visitors get the new app and drop the old saved copy.
// Doing it here means it ships however the site is built, with no extra build step to forget.
const template = readFileSync("scripts/sw-template.js", "utf8");
const version = (process.env.VERCEL_GIT_COMMIT_SHA ?? createHash("sha256").update(template).digest("hex")).slice(0, 12);
writeFileSync("public/sw.js", template.replaceAll("__VERSION__", version));

const nextConfig: NextConfig = {
  // Static export: the whole app is client-side, so it can be hosted as plain files.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactCompiler: true,
};

export default nextConfig;
