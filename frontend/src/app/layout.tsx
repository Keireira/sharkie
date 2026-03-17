import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import StyledComponentsRegistry from '@/lib/registry';
import { Providers } from '@/providers/Providers';

const inter = Inter({
	subsets: ['latin', 'cyrillic'],
	display: 'swap',
	variable: '--font-sans'
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sharkie.uha.app';

export const metadata: Metadata = {
	title: {
		default: 'Sharkie - Live Currency Exchange Rates & Converter',
		template: '%s | Sharkie'
	},
	description:
		'Free real-time currency exchange rates dashboard with interactive charts, volatility heatmaps, period comparison, and a built-in converter. Track 150+ currencies with Sharkie.',
	keywords: [
		'currency exchange rates',
		'currency converter',
		'forex rates',
		'live exchange rates',
		'currency dashboard',
		'volatility heatmap',
		'currency comparison',
		'USD exchange rate',
		'EUR exchange rate',
		'currency calculator'
	],
	authors: [{ name: 'Sharkie', url: BASE_URL }],
	creator: 'Sharkie',
	publisher: 'Sharkie',
	manifest: '/manifest.json',
	metadataBase: new URL(BASE_URL),
	alternates: {
		canonical: '/'
	},
	icons: {
		icon: [
			{ url: '/favicon.svg', type: 'image/svg+xml' },
			{ url: '/favicon.ico', sizes: '32x32' }
		],
		apple: '/icons/apple-touch-icon.png'
	},
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: BASE_URL,
		siteName: 'Sharkie',
		title: 'Sharkie - Live Currency Exchange Rates & Converter',
		description:
			'Free real-time currency exchange rates dashboard with interactive charts, volatility heatmaps, and a built-in converter. Track 150+ currencies.',
		images: [
			{
				url: '/icons/icon-512.png',
				width: 512,
				height: 512,
				alt: 'Sharkie - Currency Exchange Rates Dashboard'
			}
		]
	},
	twitter: {
		card: 'summary',
		title: 'Sharkie - Live Currency Exchange Rates & Converter',
		description: 'Free real-time currency exchange rates dashboard with interactive charts and a built-in converter.',
		images: ['/icons/icon-512.png']
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1
		}
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Sharkie'
	},
	category: 'finance'
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#FFFAF5' },
		{ media: '(prefers-color-scheme: dark)', color: '#111111' }
	]
};

const jsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebApplication',
	name: 'Sharkie',
	alternateName: 'Sharkie Currency Dashboard',
	url: BASE_URL,
	description:
		'Free real-time currency exchange rates dashboard with interactive charts, volatility heatmaps, period comparison, and a built-in converter.',
	applicationCategory: 'FinanceApplication',
	operatingSystem: 'Any',
	browserRequirements: 'Requires JavaScript',
	offers: {
		'@type': 'Offer',
		price: '0',
		priceCurrency: 'USD'
	},
	featureList: [
		'Real-time exchange rates for 150+ currencies',
		'Interactive currency charts',
		'Volatility heatmap',
		'Period comparison (WoW, MoM, QoQ, YoY)',
		'Built-in currency converter',
		'Currency world map',
		'Multi-language support (EN, RU, JA, ES)',
		'Dark and light themes',
		'PWA - installable on any device'
	],
	screenshot: `${BASE_URL}/icons/icon-512.png`,
	softwareVersion: '1.0.0',
	author: {
		'@type': 'Organization',
		name: 'Sharkie',
		url: BASE_URL
	}
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<html lang="en" className={inter.variable} suppressHydrationWarning>
			<head>
				<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Next.js JSON-LD structured data pattern */}
				<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
