/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed `output: 'export'` because static export is incompatible with NextAuth (needs dynamic server functions)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
