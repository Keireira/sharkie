'use client';

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_FAVORITES } from '@/lib/currencies';

export interface Settings {
	theme: 'dark' | 'light';
	language: 'en' | 'ru' | 'ja' | 'es';
	baseCurrency: string;
	selectedCurrencies: string[];
	favoriteCurrencies: string[];
	period: 'week' | 'month' | 'quarter' | 'halfYear' | 'year';
	customFrom: string;
	customTo: string;
}

const STORAGE_KEY = 'sharkie-settings';

const defaultSettings: Settings = {
	theme: 'dark',
	language: 'en',
	baseCurrency: 'USD',
	selectedCurrencies: ['EUR', 'GBP', 'JPY', 'KZT', 'RUB'],
	favoriteCurrencies: DEFAULT_FAVORITES,
	period: 'month',
	customFrom: '',
	customTo: ''
};

function loadSettings(): Settings {
	if (typeof window === 'undefined') return defaultSettings;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				...defaultSettings,
				...parsed,
				favoriteCurrencies: parsed.favoriteCurrencies || DEFAULT_FAVORITES
			};
		}
	} catch {
		// ignore
	}
	return defaultSettings;
}

export function useSettings() {
	const [settings, setSettingsState] = useState<Settings>(defaultSettings);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		setSettingsState(loadSettings());
		setIsLoaded(true);
	}, []);

	const setSettings = useCallback((update: Partial<Settings>) => {
		setSettingsState((prev) => {
			const next = { ...prev, ...update };
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			} catch {
				// ignore
			}
			return next;
		});
	}, []);

	return { settings, setSettings, isLoaded };
}
