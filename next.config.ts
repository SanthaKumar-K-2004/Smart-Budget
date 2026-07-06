import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "recharts",
      "lucide-react",
      "framer-motion",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-switch",
      "@radix-ui/react-tooltip",
    ],
  },
};

export default nextConfig;
