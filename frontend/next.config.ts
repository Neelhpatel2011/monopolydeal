import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Work around Windows environments where Next's internal `spawn` calls can fail (EPERM).
  // We still run a real typecheck via `npm run typecheck` before `next build`.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
