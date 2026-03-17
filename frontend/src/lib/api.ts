const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://sharkie.uha.app';

export interface DayRates {
	date: string;
	rates: Record<string, number>;
}

export interface HistoryResponse {
	base: string;
	data: DayRates[];
}

export interface HealthResponse {
	status: string;
	message: string;
}

export interface FetchRatesParams {
	from?: string;
	to?: string;
	date?: string;
	currencies?: string[];
	base?: string;
}

export const fetchHealth = async (): Promise<HealthResponse> => {
	const res = await fetch(`${API_BASE}/health`);
	if (!res.ok) throw new Error('API is down');
	return res.json();
};

export const fetchCurrencies = async (): Promise<string[]> => {
	const res = await fetch(`${API_BASE}/currencies`);
	if (!res.ok) throw new Error('Failed to fetch currencies');
	const data = await res.json();
	if (Array.isArray(data)) return data;
	if (data?.currencies && Array.isArray(data.currencies)) return data.currencies;
	return [];
};

export const fetchRates = async (params: FetchRatesParams): Promise<HistoryResponse> => {
	const searchParams = new URLSearchParams();

	if (params.date) {
		searchParams.set('date', params.date);
	} else {
		if (params.from) searchParams.set('from', params.from);
		if (params.to) searchParams.set('to', params.to);
	}

	if (params.currencies?.length) {
		searchParams.set('currencies', params.currencies.join(','));
	}

	if (params.base) {
		searchParams.set('base', params.base);
	}

	const res = await fetch(`${API_BASE}/history?${searchParams.toString()}`);

	if (!res.ok) {
		const error = await res.json().catch(() => ({ message: 'Unknown error' }));
		throw new Error(error.message || `HTTP ${res.status}`);
	}

	return res.json();
};
