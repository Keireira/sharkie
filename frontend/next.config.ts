import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const withPWA = withPWAInit({
	dest: 'public',
	cacheOnFrontEndNav: true,
	reloadOnOnline: true,
	disable: process.env.NODE_ENV === 'development'
});

const nextConfig: NextConfig = {
	output: 'export',
	turbopack: {},
	compiler: {
		styledComponents: true
	}
};

export default withPWA(nextConfig);
