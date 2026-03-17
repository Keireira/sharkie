'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HistoryResponse } from '@/lib/api';
import { fetchRates } from '@/lib/api';

/**
 * Centralized rate store.
 * All rates are stored normalized to USD base.
 * Key pattern: ['usd-rates', date] -> Record<string, number>
 *
 * Components call useRate(from, to, date) to get a single conversion rate.
 * The store fetches only if the needed currencies aren't cached for that date.
 */

type RatesMap = Record<string, number>;

const getDateKey = (date: string) => ['usd-rates', date] as const;

/** Merge new rates into the cached map for a given date */
const mergeRates = (queryClient: ReturnType<typeof useQueryClient>, date: string, rates: RatesMap) => {
	const key = getDateKey(date);
	const existing = queryClient.getQueryData<RatesMap>(key) ?? {};
	const merged = { ...existing, ...rates };
	queryClient.setQueryData(key, merged);
};

/**
 * Feed bulk history data (e.g. from dashboard queries) into the store.
 * Call this after any fetchRates that returns HistoryResponse.
 */
export const useFeedRateStore = () => {
	const queryClient = useQueryClient();

	const feedStore = (data: HistoryResponse | undefined, base: string) => {
		if (!data?.data?.length) return;

		for (const entry of data.data) {
			const usdRates: RatesMap = {};

			if (base === 'USD') {
				Object.assign(usdRates, entry.rates);
			} else {
				const usdPerBase = entry.rates.USD;
				if (usdPerBase != null && usdPerBase !== 0) {
					for (const [code, rate] of Object.entries(entry.rates)) {
						if (code === 'USD') continue;
						usdRates[code] = rate / usdPerBase;
					}
					usdRates[base] = 1 / usdPerBase;
				}
			}

			if (Object.keys(usdRates).length > 0) {
				mergeRates(queryClient, entry.date, usdRates);
			}
		}
	};

	return feedStore;
};

/**
 * Get a single conversion rate for from->to on a specific date.
 * Checks the centralized cache first, fetches from API if missing.
 */
export const useRate = (from: string, to: string, date: string, enabled = true) => {
	const queryClient = useQueryClient();

	const cached = queryClient.getQueryData<RatesMap>(getDateKey(date));
	const fromCached = from === 'USD' ? 1 : cached?.[from];
	const toCached = to === 'USD' ? 1 : cached?.[to];
	const hasCached = from === to || (fromCached != null && toCached != null);

	const { data: fetchedData, isFetching } = useQuery({
		queryKey: ['usd-rates-fetch', date],
		queryFn: async () => {
			const result = await fetchRates({ date, base: 'USD' });
			if (result?.data?.length) {
				for (const entry of result.data) {
					mergeRates(queryClient, entry.date, entry.rates);
				}
			}
			return result;
		},
		enabled: enabled && !!date && !hasCached && from !== to,
		staleTime: 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		retry: 2
	});

	// Compute rate from cache or fresh fetch
	const computeRate = (): number | null => {
		if (from === to) return 1;

		const current = queryClient.getQueryData<RatesMap>(getDateKey(date));
		const fromRate = from === 'USD' ? 1 : current?.[from];
		const toRate = to === 'USD' ? 1 : current?.[to];

		if (fromRate != null && toRate != null) {
			return toRate / fromRate;
		}

		if (fetchedData?.data?.length) {
			const entry = fetchedData.data[fetchedData.data.length - 1];
			const fr = from === 'USD' ? 1 : entry?.rates[from];
			const tr = to === 'USD' ? 1 : entry?.rates[to];
			if (fr != null && tr != null) return tr / fr;
		}

		return null;
	};

	const rate = computeRate();

	return { rate, isFetching };
};

/**
 * Fetch rates for a date range (for charts/tables).
 * Results are fed into the central store.
 */
export const useRangeRates = (from: string, to: string, currencies: string[], enabled = true) => {
	const queryClient = useQueryClient();

	const sortedCurrencies = (() => {
		const set = new Set(currencies);
		set.delete('USD');
		return Array.from(set).sort();
	})();

	return useQuery({
		queryKey: ['usd-range', from, to, ...sortedCurrencies],
		queryFn: async () => {
			const result = await fetchRates({
				from,
				to,
				base: 'USD',
				currencies: sortedCurrencies
			});
			if (result?.data?.length) {
				for (const entry of result.data) {
					mergeRates(queryClient, entry.date, entry.rates);
				}
			}
			return result;
		},
		enabled: enabled && !!from && !!to && sortedCurrencies.length > 0,
		staleTime: 30 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		retry: 2
	});
};
