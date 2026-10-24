/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  agentRules: false,
  serverExternalPackages: ['mongodb'],
  serverActions: {
    bodySizeLimit: '12mb',
  },
};

export default nextConfig;
