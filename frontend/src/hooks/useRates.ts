'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchRates, fetchHealth, fetchCurrencies } from '@/lib/api';
import { format, subMonths, subWeeks, subYears } from 'date-fns';
import type { Settings } from './useSettings';

export function getPeriodDates(period: Settings['period']) {
	const to = new Date();
	let from: Date;

	switch (period) {
		case 'week':
			from = subWeeks(to, 1);
			break;
		case 'month':
			from = subMonths(to, 1);
			break;
		case 'quarter':
			from = subMonths(to, 3);
			break;
		case 'halfYear':
			from = subMonths(to, 6);
			break;
		case 'year':
			from = subYears(to, 1);
			break;
	}

	return {
		from: format(from, 'yyyy-MM-dd'),
		to: format(to, 'yyyy-MM-dd')
	};
}

export function useRatesQuery(settings: Settings) {
	const periodDates = getPeriodDates(settings.period);
	const from = settings.customFrom || periodDates.from;
	const to = settings.customTo || periodDates.to;

	return useQuery({
		queryKey: ['rates', from, to, settings.baseCurrency, settings.selectedCurrencies],
		queryFn: () =>
			fetchRates({
				from,
				to,
				base: settings.baseCurrency,
				currencies: settings.selectedCurrencies
			}),
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		retry: 2
	});
}

export type CompareMode = 'week' | 'month' | 'quarter' | 'halfYear' | 'year';

function shiftDate(date: Date, mode: CompareMode): Date {
	switch (mode) {
		case 'week':
			return subWeeks(date, 1);
		case 'month':
			return subMonths(date, 1);
		case 'quarter':
			return subMonths(date, 3);
		case 'halfYear':
			return subMonths(date, 6);
		case 'year':
			return subYears(date, 1);
	}
}

export function useCompareRatesQuery(settings: Settings, compareMode: CompareMode) {
	const periodDates = getPeriodDates(settings.period);
	const from = settings.customFrom || periodDates.from;
	const to = settings.customTo || periodDates.to;

	const prevFrom = format(shiftDate(new Date(from), compareMode), 'yyyy-MM-dd');
	const prevTo = format(shiftDate(new Date(to), compareMode), 'yyyy-MM-dd');

	return {
		...useQuery({
			queryKey: ['rates-compare', compareMode, prevFrom, prevTo, settings.baseCurrency, settings.selectedCurrencies],
			queryFn: () =>
				fetchRates({
					from: prevFrom,
					to: prevTo,
					base: settings.baseCurrency,
					currencies: settings.selectedCurrencies
				}),
			staleTime: 30 * 60 * 1000,
			gcTime: 60 * 60 * 1000,
			refetchOnWindowFocus: false,
			retry: 2
		}),
		prevFrom,
		prevTo
	};
}

export function useTodayAllRatesQuery(baseCurrency: string) {
	const today = format(new Date(), 'yyyy-MM-dd');

	return useQuery({
		queryKey: ['rates-all', today, baseCurrency],
		queryFn: () =>
			fetchRates({
				date: today,
				base: baseCurrency
			}),
		staleTime: 15 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		retry: 2
	});
}

export function useCurrenciesQuery() {
	return useQuery({
		queryKey: ['currencies'],
		queryFn: fetchCurrencies,
		staleTime: 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		retry: 2
	});
}

export function useHealthQuery() {
	return useQuery({
		queryKey: ['health'],
		queryFn: fetchHealth,
		staleTime: 60 * 1000,
		refetchInterval: 60 * 1000,
		retry: 1
	});
}
