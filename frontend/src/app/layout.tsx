import type { Metadata, Viewport } from 'next';
import './globals.css';
import StyledComponentsRegistry from '@/lib/registry';
import { Providers } from '@/providers/Providers';

export const metadata: Metadata = {
	title: 'Sharkie - Currency Exchange Rates',
	description: 'Beautiful currency exchange rates dashboard with interactive charts and cats',
	manifest: '/manifest.json',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Sharkie'
	}
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	themeColor: '#6366f1'
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="apple-touch-icon" href="/icons/icon-192.png" />
			</head>
			<body>
				<StyledComponentsRegistry>
					<Providers>{children}</Providers>
				</StyledComponentsRegistry>
			</body>
		</html>
	);
};

export default RootLayout;
