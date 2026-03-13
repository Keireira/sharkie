import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const withPWA = withPWAInit({
	dest: 'public',
	cacheOnFrontEndNav: true,
	reloadOnOnline: true,
	disable: process.env.NODE_ENV === 'development'
});

const nextConfig: NextConfig = {
	output: 'standalone',
	turbopack: {},
	compiler: {
		styledComponents: true
	},
	async rewrites() {
		const apiBase = process.env.API_BASE || 'http://0.0.0.0:3000';
		return [
			{
				source: '/api/proxy/:path*',
				destination: `${apiBase}/:path*`
			}
		];
	}
};

export default withPWA(nextConfig);
