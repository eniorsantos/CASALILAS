/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  // Lint roda separado via `npm run lint` (ESLint 9 flat config,
  // incompatível com o `next lint` embutido do Next 14).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
