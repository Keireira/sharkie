'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRates, type HistoryResponse } from '@/lib/api';

/**
 * Centralized rate store.
 * All rates are stored normalized to USD base.
 * Key pattern: ['usd-rates', date] → Record<string, number>
 *
 * Components call useRate(from, to, date) to get a single conversion rate.
 * The store fetches only if the needed currencies aren't cached for that date.
 */

type RatesMap = Record<string, number>;

function getDateKey(date: string) {
	return ['usd-rates', date] as const;
}

/** Merge new rates into the cached map for a given date */
function mergeRates(queryClient: ReturnType<typeof useQueryClient>, date: string, rates: RatesMap) {
	const key = getDateKey(date);
	const existing = queryClient.getQueryData<RatesMap>(key) || {};
	const merged = { ...existing, ...rates };
	queryClient.setQueryData(key, merged);
}

/**
 * Feed bulk history data (e.g. from dashboard queries) into the store.
 * Call this after any fetchRates that returns HistoryResponse.
 */
export function useFeedRateStore() {
	const queryClient = useQueryClient();

	return useCallback(
		(data: HistoryResponse | undefined, base: string) => {
			if (!data?.data?.length) return;

			for (const entry of data.data) {
				const usdRates: RatesMap = {};

				if (base === 'USD') {
					// Rates are already relative to USD
					Object.assign(usdRates, entry.rates);
				} else {
					// Convert: we have rates relative to `base`
					// entry.rates[X] = X per 1 base
					// We need X per 1 USD
					// If USD is in entry.rates: usdRate = entry.rates[USD]
					// Then X per 1 USD = entry.rates[X] / entry.rates[USD]
					const usdPerBase = entry.rates['USD'];
					if (usdPerBase != null && usdPerBase !== 0) {
						for (const [code, rate] of Object.entries(entry.rates)) {
							if (code === 'USD') continue;
							usdRates[code] = rate / usdPerBase;
						}
						// Also store the base currency itself
						usdRates[base] = 1 / usdPerBase;
					}
				}

				if (Object.keys(usdRates).length > 0) {
					mergeRates(queryClient, entry.date, usdRates);
				}
			}
		},
		[queryClient]
	);
}

/**
 * Get a single conversion rate for from→to on a specific date.
 * Checks the centralized cache first, fetches from API if missing.
 */
export function useRate(from: string, to: string, date: string, enabled = true) {
	const queryClient = useQueryClient();

	// Check if we already have both currencies in cache
	const cached = queryClient.getQueryData<RatesMap>(getDateKey(date));
	const fromCached = from === 'USD' ? 1 : cached?.[from];
	const toCached = to === 'USD' ? 1 : cached?.[to];
	const hasCached = from === to || (fromCached != null && toCached != null);

	// Fetch ALL currencies for the date (not just the pair) so the whole day is cached
	const { data: fetchedData, isFetching } = useQuery({
		queryKey: ['usd-rates-fetch', date],
		queryFn: async () => {
			const result = await fetchRates({ date, base: 'USD' });
			// Feed into the central cache
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
	const rate = useMemo(() => {
		if (from === to) return 1;

		// Try cache first (may have been updated by feed or fetch)
		const current = queryClient.getQueryData<RatesMap>(getDateKey(date));
		const fromRate = from === 'USD' ? 1 : current?.[from];
		const toRate = to === 'USD' ? 1 : current?.[to];

		if (fromRate != null && toRate != null) {
			return toRate / fromRate;
		}

		// Try from fetched data directly
		if (fetchedData?.data?.length) {
			const entry = fetchedData.data[fetchedData.data.length - 1];
			const fr = from === 'USD' ? 1 : entry.rates[from];
			const tr = to === 'USD' ? 1 : entry.rates[to];
			if (fr != null && tr != null) return tr / fr;
		}

		return null;
	}, [from, to, date, cached, fetchedData, queryClient]);

	return { rate, isFetching };
}

/**
 * Fetch rates for a date range (for charts/tables).
 * Results are fed into the central store.
 */
export function useRangeRates(from: string, to: string, currencies: string[], enabled = true) {
	const queryClient = useQueryClient();

	const sortedCurrencies = useMemo(() => {
		const set = new Set(currencies);
		set.delete('USD');
		return Array.from(set).sort();
	}, [currencies]);

	return useQuery({
		queryKey: ['usd-range', from, to, ...sortedCurrencies],
		queryFn: async () => {
			const result = await fetchRates({
				from,
				to,
				base: 'USD',
				currencies: sortedCurrencies
			});
			// Feed into central cache
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
}
