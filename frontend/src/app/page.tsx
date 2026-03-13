'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import CurrencyCards from '@/components/CurrencyCards';
import Calculator from '@/components/Calculator';
import CurrencyMap from '@/components/CurrencyMap';
import ChartTableView from '@/components/ChartTableView';
import CurrencyHistory from '@/components/CurrencyHistory';
import CurrencyLibrary from '@/components/CurrencyLibrary';
import VolatilityHeatmap from '@/components/VolatilityHeatmap';
import PeriodComparison from '@/components/PeriodComparison';
import CatMascot, { type CatMood } from '@/components/CatMascot';
import CalculatorView from '@/components/CalculatorView';
import { useAppSettings } from '@/providers/Providers';
import { useRatesQuery, useCompareRatesQuery, type CompareMode } from '@/hooks/useRates';
import { useFeedRateStore } from '@/hooks/useRateStore';

const DashboardShell = styled.div`
	display: flex;
	min-height: 100vh;
	background: ${({ theme }) => theme.colors.bg};
	color: ${({ theme }) => theme.colors.text};
	transition:
		background-color 0.3s ease,
		color 0.3s ease;
`;

const MainArea = styled.div`
	flex: 1;
	margin-left: 260px;
	padding-top: 0;
	min-height: 100vh;
	overflow-x: hidden;

	@media (max-width: 768px) {
		margin-left: 0;
		padding-top: 48px;
	}
`;

const Content = styled.main`
	max-width: 1400px;
	margin: 0 auto;
	padding: ${({ theme }) => theme.spacing.lg};

	@media (max-width: 768px) {
		padding: ${({ theme }) => theme.spacing.md};
	}
`;

/* ── Dashboard grid ─────────────────────────────── */
const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 380px;
	grid-template-rows: auto;
	gap: ${({ theme }) => theme.spacing.lg};

	@media (max-width: 1200px) {
		grid-template-columns: 1fr 340px;
	}

	@media (max-width: 960px) {
		grid-template-columns: 1fr;
	}

	@media (max-width: 768px) {
		gap: ${({ theme }) => theme.spacing.md};
	}
`;

const Section = styled.section`
	scroll-margin-top: 72px;
	min-width: 0;

	@media (max-width: 768px) {
		scroll-margin-top: 60px;
	}
`;

/* Spans full width of both columns */
const FullRow = styled(Section)`
	grid-column: 1 / -1;
`;

/* Left column (main) */
const MainCol = styled(Section)`
	grid-column: 1;

	@media (max-width: 960px) {
		grid-column: 1 / -1;
	}
`;

/* Right column (sidebar widgets) */
const SideCol = styled(Section)`
	grid-column: 2;
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.lg};

	@media (max-width: 960px) {
		grid-column: 1 / -1;
	}

	@media (max-width: 768px) {
		gap: ${({ theme }) => theme.spacing.md};
	}
`;

const Loader = styled(motion.div)`
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${({ theme }) => theme.colors.bg};
`;

const Spinner = styled(motion.div)`
	width: 32px;
	height: 32px;
	border: 3px solid ${({ theme }) => theme.colors.border};
	border-top-color: ${({ theme }) => theme.colors.accent};
	border-radius: 50%;
`;

const VisuallyHidden = styled.h1`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
`;

const Home = () => {
	const { settings, setSettings, isLoaded, calcOpen, setCalcOpen, viewMode } = useAppSettings();
	const { data, isLoading, isError, error } = useRatesQuery(settings);
	const [compareMode, setCompareMode] = useState<CompareMode>('year');
	const { data: compareData } = useCompareRatesQuery(settings, compareMode);
	const feedStore = useFeedRateStore();

	// Feed dashboard data into centralized rate store
	useEffect(() => {
		if (data) feedStore(data, data.base);
	}, [data, feedStore]);
	useEffect(() => {
		if (compareData) feedStore(compareData, compareData.base);
	}, [compareData, feedStore]);
	const [hasGreeted, setHasGreeted] = useState(false);
	const [chartCurrencies, setChartCurrencies] = useState<string[]>([]);
	const [catPos, setCatPos] = useState<{ xPct: number; yPct: number } | null>(null);
	const handleCatPosChange = useCallback((pos: { xPct: number; yPct: number } | null) => {
		setCatPos(pos);
	}, []);

	const catMood: CatMood = useMemo(() => {
		if (!hasGreeted) return 'greeting';
		if (isLoading) return 'loading';
		if (isError) return 'error';
		if (data) return 'success';
		return 'idle';
	}, [isLoading, isError, data, hasGreeted]);

	useEffect(() => {
		if (!hasGreeted) {
			const timer = setTimeout(() => setHasGreeted(true), 3000);
			return () => clearTimeout(timer);
		}
	}, [hasGreeted]);

	const filteredCurrencies = useMemo(() => {
		let list = settings.selectedCurrencies;

		// Hide base currency — replace with USD if not already present
		if (list.includes(settings.baseCurrency)) {
			list = list.filter((c) => c !== settings.baseCurrency);
			if (!list.includes('USD') && settings.baseCurrency !== 'USD') {
				list = ['USD', ...list];
			}
		}

		return list;
	}, [settings.selectedCurrencies, settings.baseCurrency]);

	// Sync chart currencies with filtered list — default to first 5
	useEffect(() => {
		setChartCurrencies((prev) => {
			const valid = prev.filter((c) => filteredCurrencies.includes(c));
			if (valid.length > 0) return valid;
			return filteredCurrencies.slice(0, 5);
		});
	}, [filteredCurrencies]);

	// Auto-open calculator from URL ?calc=...
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.has('calc')) setCalcOpen(true);
	}, []);

	const handleToggleMapCurrency = useCallback(
		(code: string) => {
			if (code === settings.baseCurrency) return;
			if (settings.selectedCurrencies.includes(code)) {
				setSettings({ selectedCurrencies: settings.selectedCurrencies.filter((c) => c !== code) });
			} else if (settings.selectedCurrencies.length < 6) {
				setSettings({ selectedCurrencies: [...settings.selectedCurrencies, code] });
			}
		},
		[settings.selectedCurrencies, settings.baseCurrency, setSettings]
	);

	const toggleChartCurrency = useCallback((code: string) => {
		setChartCurrencies((prev) => {
			if (prev.includes(code)) {
				// Don't allow removing the last one
				if (prev.length <= 1) return prev;
				return prev.filter((c) => c !== code);
			}
			return [...prev, code];
		});
	}, []);

	if (!isLoaded) {
		return (
			<Loader initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
				<Spinner animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
			</Loader>
		);
	}

	if (viewMode === 'calculator') {
		return (
			<DashboardShell>
				<Sidebar />
				<TopBar />
				<MainArea>
					<CalculatorView />
				</MainArea>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<Sidebar />
			<TopBar />
			<MainArea>
				<Content>
					<VisuallyHidden>Sharkie — Live Currency Exchange Rates Dashboard</VisuallyHidden>
					<Grid>
						{/* Row 1: Currency cards (full width) */}
						<FullRow id="cards" aria-label="Currency overview cards">
							<CurrencyCards
								data={data}
								currencies={filteredCurrencies}
								chartCurrencies={chartCurrencies}
								onToggleChart={toggleChartCurrency}
								isLoading={isLoading}
							/>
						</FullRow>

						{/* Row 3: Chart / Table (full width) */}
						<FullRow id="chart" aria-label="Exchange rate chart and table">
							<ChartTableView
								data={data}
								isLoading={isLoading}
								isError={isError}
								error={error}
								chartCurrencies={chartCurrencies}
								tableCurrencies={filteredCurrencies}
							/>
						</FullRow>

						{/* Row 4: Map (left) + History (right) */}
						<MainCol id="map" aria-label="Currency world map">
							<CurrencyMap currencies={filteredCurrencies} onAddCurrency={handleToggleMapCurrency} />
						</MainCol>
						<SideCol id="history" aria-label="Currency rate history">
							<CurrencyHistory data={data} currencies={filteredCurrencies} />
						</SideCol>

						{/* Volatility Heatmap (full width) */}
						<FullRow id="heatmap" aria-label="Volatility heatmap">
							<VolatilityHeatmap data={data} currencies={filteredCurrencies} />
						</FullRow>

						{/* Period Comparison (full width) */}
						<FullRow id="comparison" aria-label="Period comparison">
							<PeriodComparison
								currentData={data}
								compareData={compareData}
								currencies={filteredCurrencies}
								compareMode={compareMode}
								onCompareModeChange={setCompareMode}
							/>
						</FullRow>

						{/* Currency Library (full width) */}
						<FullRow id="library" aria-label="Currency library">
							<CurrencyLibrary />
						</FullRow>
					</Grid>
				</Content>
			</MainArea>
			<Calculator
				data={data}
				baseCurrency={settings.baseCurrency}
				currencies={settings.selectedCurrencies}
				open={calcOpen}
				onClose={() => setCalcOpen(false)}
				catPos={catPos}
			/>
			<CatMascot
				mood={catMood}
				calcOpen={calcOpen}
				onCalcToggle={() => setCalcOpen((v) => !v)}
				onPositionChange={handleCatPosChange}
			/>
		</DashboardShell>
	);
};

export default Home;
