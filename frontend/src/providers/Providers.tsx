'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from 'styled-components';
import { type Settings, useSettings } from '@/hooks/useSettings';
import { fetchHealth } from '@/lib/api';
import i18n from '@/lib/i18n';
import { darkTheme, lightTheme } from '@/lib/theme';

export type ViewMode = 'dashboard' | 'calculator';

interface SettingsContextType {
	settings: Settings;
	setSettings: (update: Partial<Settings>) => void;
	isLoaded: boolean;
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
	calcOpen: boolean;
	setCalcOpen: (open: boolean | ((v: boolean) => boolean)) => void;
	viewMode: ViewMode;
	setViewMode: (mode: ViewMode) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
	settings: {} as Settings,
	setSettings: () => {},
	isLoaded: false,
	searchQuery: '',
	setSearchQuery: () => {},
	sidebarOpen: false,
	setSidebarOpen: () => {},
	calcOpen: false,
	setCalcOpen: () => {},
	viewMode: 'dashboard',
	setViewMode: () => {}
});

export const useAppSettings = () => useContext(SettingsContext);

export const Providers = ({ children }: { children: React.ReactNode }) => {
	const [queryClient] = useState(() => {
		const client = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 5 * 60 * 1000,
					gcTime: 30 * 60 * 1000
				}
			}
		});
		// Prefetch health check before any other queries
		client.prefetchQuery({ queryKey: ['health'], queryFn: fetchHealth });
		return client;
	});

	const { settings, setSettings, isLoaded } = useSettings();
	const [searchQuery, setSearchQuery] = useState('');
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [calcOpen, setCalcOpen] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>(() => {
		if (typeof window === 'undefined') return 'dashboard';
		return window.innerWidth <= 768 ? 'calculator' : 'dashboard';
	});

	useEffect(() => {
		if (isLoaded) {
			i18n.changeLanguage(settings.language);
			localStorage.setItem('sharkie-lang', settings.language);
			document.documentElement.lang = settings.language;
		}
	}, [settings.language, isLoaded]);

	const theme = settings.theme === 'dark' ? darkTheme : lightTheme;

	return (
		<QueryClientProvider client={queryClient}>
			<SettingsContext.Provider
				value={{
					settings,
					setSettings,
					isLoaded,
					searchQuery,
					setSearchQuery,
					sidebarOpen,
					setSidebarOpen,
					calcOpen,
					setCalcOpen,
					viewMode,
					setViewMode
				}}
			>
				<I18nextProvider i18n={i18n}>
					<ThemeProvider theme={theme}>{children}</ThemeProvider>
				</I18nextProvider>
			</SettingsContext.Provider>
		</QueryClientProvider>
	);
};
