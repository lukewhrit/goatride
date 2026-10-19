import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Avatars are public Vercel Blob URLs (see src/lib/avatarStorage.ts)
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com', pathname: '/avatars/**' },
    ],
  },
};

export default nextConfig;
