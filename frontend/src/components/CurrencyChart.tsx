'use client';

import React, { useMemo, useState, useCallback } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Brush,
	ReferenceLine
} from 'recharts';
import type { HistoryResponse } from '@/lib/api';
import type { AppTheme } from '@/lib/theme';
import { CURRENCY_FLAGS, getCurrencyName, formatRate as fmtRate } from '@/lib/currencies';

import { CURRENCY_PALETTE } from '@/lib/currencies';

const CHART_COLORS = CURRENCY_PALETTE;

const shimmer = keyframes`
	0% { background-position: -200% 0; }
	100% { background-position: 200% 0; }
`;

const Card = styled(motion.div)`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadow};
	padding: ${({ theme }) => theme.spacing.lg};
	display: flex;
	flex-direction: column;

	@media (max-width: 768px) {
		padding: ${({ theme }) => theme.spacing.md};
	}
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const TitleBar = styled.div`
	width: 3px;
	height: 20px;
	border-radius: 2px;
	background: linear-gradient(180deg, ${({ theme }) => theme.colors.gradientStart}, ${({ theme }) => theme.colors.gradientEnd});
`;

const Title = styled.h2`
	font-size: 16px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	letter-spacing: -0.01em;
`;

/* ── Legend ──────────────────────────────── */

const LegendRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	flex-wrap: wrap;
	margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const LegendItem = styled.button<{ $active: boolean; $color: string }>`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 5px 12px;
	border: 1px solid ${({ $active, $color, theme }) => ($active ? $color : theme.colors.border)};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	background: ${({ $active, $color }) => ($active ? `${$color}15` : 'transparent')};
	color: ${({ $active, $color, theme }) => ($active ? $color : theme.colors.textMuted)};
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s;
	opacity: ${({ $active }) => ($active ? 1 : 0.5)};

	&:hover {
		opacity: 1;
		border-color: ${({ $color }) => $color};
	}
`;

const LegendDot = styled.span<{ $color: string }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $color }) => $color};
`;

/* ── Chart area ──────────────────────────── */

const ChartWrap = styled.div`
	width: 100%;
	height: 400px;

	@media (max-width: 768px) {
		height: 300px;
	}

	.recharts-brush-slide {
		fill-opacity: 0.08;
	}
`;

const StatusWrap = styled.div`
	width: 100%;
	height: 400px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: ${({ theme }) => theme.spacing.md};

	@media (max-width: 768px) {
		height: 300px;
	}
`;

const SkeletonLine = styled.div`
	width: 80%;
	height: 4px;
	border-radius: 2px;
	background: linear-gradient(90deg,
		${({ theme }) => theme.colors.bgSecondary} 25%,
		${({ theme }) => theme.colors.border} 50%,
		${({ theme }) => theme.colors.bgSecondary} 75%
	);
	background-size: 200% 100%;
	animation: ${shimmer} 1.5s ease-in-out infinite;
	margin: 4px 0;
`;

const StatusText = styled.p`
	font-size: 14px;
	color: ${({ theme }) => theme.colors.textMuted};
	text-align: center;
`;

const ErrorText = styled.p`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.danger};
`;

/* ── Tooltip ─────────────────────────────── */

const TooltipBox = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	padding: 14px 18px;
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	min-width: 180px;
	backdrop-filter: blur(12px);
`;

const TooltipDate = styled.div`
	font-size: 13px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	margin-bottom: 10px;
	padding-bottom: 8px;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TooltipRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 4px 0;
	font-size: 13px;
`;

const TooltipDot = styled.span<{ $color: string }>`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: ${({ $color }) => $color};
	box-shadow: 0 0 6px ${({ $color }) => $color}80;
	flex-shrink: 0;
`;

const TooltipFlag = styled.span`
	font-size: 14px;
	line-height: 1;
`;

const TooltipName = styled.span`
	color: ${({ theme }) => theme.colors.textSecondary};
	flex: 1;
	font-weight: 500;
`;

const TooltipVal = styled.span`
	font-weight: 800;
	color: ${({ theme }) => theme.colors.text};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;
`;

const TooltipChange = styled.span<{ $positive: boolean }>`
	font-size: 11px;
	font-weight: 700;
	color: ${({ $positive, theme }) => ($positive ? theme.colors.success : theme.colors.danger)};
	margin-left: 4px;
`;

/* ── Helpers ─────────────────────────────── */

const currentYear = new Date().getFullYear();

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const formatDateShort = (dateStr: string, lang: string): string => {
	// dateStr = "YYYY-MM-DD"
	const parts = dateStr.split('-');
	if (parts.length < 3) return dateStr;
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1;
	const day = parseInt(parts[2], 10);
	const months = lang === 'ru' ? MONTHS_RU : MONTHS_EN;
	if (year !== currentYear) {
		return `${day} ${months[month]} '${String(year).slice(2)}`;
	}
	return `${day} ${months[month]}`;
};

const formatDateFull = (dateStr: string, lang: string): string => {
	const parts = dateStr.split('-');
	if (parts.length < 3) return dateStr;
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1;
	const day = parseInt(parts[2], 10);
	const months = lang === 'ru' ? MONTHS_RU : MONTHS_EN;
	return `${day} ${months[month]} ${year}`;
};

// formatRate imported as fmtRate from @/lib/currencies

/* ── Component ───────────────────────────── */

interface ChartDataPoint {
	date: string;
	dateFormatted: string;
	[key: string]: string | number | undefined;
}

interface CurrencyChartProps {
	data?: HistoryResponse;
	isLoading: boolean;
	isError: boolean;
	error?: Error | null;
	currencies: string[];
}

const CurrencyChart = ({ data, isLoading, isError, error, currencies }: CurrencyChartProps) => {
	const { t, i18n } = useTranslation();
	const theme = useTheme() as AppTheme;
	const [hiddenCurrencies, setHiddenCurrencies] = useState<Set<string>>(new Set());

	const visibleCurrencies = useMemo(
		() => currencies.filter((c) => !hiddenCurrencies.has(c)),
		[currencies, hiddenCurrencies]
	);

	const isNormalized = visibleCurrencies.length > 1;

	// Compute first-day values for normalization & tooltip change
	const firstDayRates = useMemo(() => {
		if (!data?.data?.length) return {} as Record<string, number>;
		return data.data[0].rates;
	}, [data]);

	const chartData: ChartDataPoint[] = useMemo(() => {
		if (!data?.data) return [];
		return data.data.map((day) => {
			const point: ChartDataPoint = {
				date: day.date,
				dateFormatted: formatDateShort(day.date, i18n.language)
			};
			for (const code of visibleCurrencies) {
				const rate = day.rates[code];
				if (rate == null) continue;
				if (isNormalized) {
					// Normalize: % change from first day (first day = 0%)
					const base = firstDayRates[code];
					point[code] = base && base !== 0 ? ((rate - base) / base) * 100 : 0;
				} else {
					point[code] = rate;
				}
				// Always store raw rate for tooltip
				point[`_raw_${code}`] = rate;
			}
			return point;
		});
	}, [data, i18n.language, visibleCurrencies, isNormalized, firstDayRates]);

	const toggleCurrency = useCallback((code: string) => {
		setHiddenCurrencies((prev) => {
			const next = new Set(prev);
			if (next.has(code)) {
				next.delete(code);
			} else {
				// Don't hide the last visible one
				const willBeVisible = currencies.filter((c) => !next.has(c) && c !== code);
				if (willBeVisible.length === 0) return prev;
				next.add(code);
			}
			return next;
		});
	}, [currencies]);

	// Average rate for reference line (only for single-currency view)
	const avgRate = useMemo(() => {
		if (visibleCurrencies.length !== 1 || !chartData.length) return null;
		const code = visibleCurrencies[0];
		const values = chartData.map((d) => d[code] as number).filter((v) => v != null);
		if (!values.length) return null;
		return values.reduce((a, b) => a + b, 0) / values.length;
	}, [visibleCurrencies, chartData]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const CustomTooltip = useCallback(({ active, payload }: any) => {
		if (!active || !payload?.length) return null;
		// Get the data point from payload (recharts attaches it)
		const dataPoint = payload[0]?.payload as ChartDataPoint | undefined;
		const dateStr = dataPoint?.date || '';
		return (
			<TooltipBox>
				<TooltipDate>{formatDateFull(dateStr, i18n.language)}</TooltipDate>
				{payload.map((entry: { color: string; name: string; value: number }, idx: number) => {
					const rawRate = dataPoint?.[`_raw_${entry.name}`] as number | undefined;
					const pctChange = isNormalized ? entry.value : null;
					return (
						<TooltipRow key={idx}>
							<TooltipDot $color={entry.color} />
							<TooltipFlag>{CURRENCY_FLAGS[entry.name] || ''}</TooltipFlag>
							<TooltipName>{entry.name}</TooltipName>
							<TooltipVal>{fmtRate(rawRate ?? entry.value, entry.name, i18n.language)}</TooltipVal>
							{pctChange !== null && (
								<TooltipChange $positive={pctChange >= 0}>
									{pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
								</TooltipChange>
							)}
						</TooltipRow>
					);
				})}
			</TooltipBox>
		);
	}, [i18n.language, isNormalized]);

	const renderContent = () => {
		if (isLoading) {
			return (
				<StatusWrap>
					{Array.from({ length: 5 }).map((_, i) => (
						<SkeletonLine key={i} style={{ width: `${60 + Math.random() * 30}%`, opacity: 1 - i * 0.15 }} />
					))}
					<StatusText>{t('chart.loading')}</StatusText>
				</StatusWrap>
			);
		}

		if (isError) {
			return (
				<StatusWrap>
					<StatusText>{t('chart.error')}</StatusText>
					<ErrorText>{error?.message}</ErrorText>
				</StatusWrap>
			);
		}

		if (!chartData.length) {
			return (
				<StatusWrap>
					<StatusText>{t('chart.noData')}</StatusText>
				</StatusWrap>
			);
		}

		const brushStartIndex = Math.max(0, chartData.length - Math.min(chartData.length, 90));

		return (
			<ChartWrap>
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
						<defs>
							{currencies.map((currency, i) => (
								<linearGradient key={currency} id={`grad-${currency}`} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.25} />
									<stop offset="50%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.1} />
									<stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.25} />
								</linearGradient>
							))}
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke={theme.colors.chartGrid}
							vertical={false}
						/>
						<XAxis
							dataKey="dateFormatted"
							tick={{ fontSize: 11, fill: theme.colors.textMuted }}
							tickLine={false}
							axisLine={{ stroke: theme.colors.chartGrid }}
							interval="preserveStartEnd"
							minTickGap={40}
						/>
						<YAxis
							tick={{ fontSize: 11, fill: theme.colors.textMuted }}
							tickLine={false}
							axisLine={false}
							width={60}
							domain={isNormalized ? ['auto', 'auto'] : ['auto', 'auto']}
							tickFormatter={(v: number) => {
								if (isNormalized) return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
								if (v >= 10000) return `${(v / 1000).toFixed(0)}k`;
								if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
								if (v >= 100) return v.toFixed(0);
								if (v >= 1) return v.toFixed(2);
								return v.toFixed(3);
							}}
						/>
						<Tooltip
							content={<CustomTooltip />}
							cursor={{
								stroke: theme.colors.accent,
								strokeWidth: 1,
								strokeDasharray: '4 4',
								opacity: 0.6
							}}
						/>

						{/* 0% baseline when normalized */}
						{isNormalized && (
							<ReferenceLine
								y={0}
								stroke={theme.colors.textMuted}
								strokeDasharray="6 4"
								strokeWidth={1}
								label={{
									value: '0%',
									position: 'insideTopRight',
									fill: theme.colors.textMuted,
									fontSize: 10,
									fontWeight: 600
								}}
							/>
						)}

						{/* Average reference line for single currency */}
						{!isNormalized && avgRate !== null && (
							<ReferenceLine
								y={avgRate}
								stroke={theme.colors.textMuted}
								strokeDasharray="6 4"
								strokeWidth={1}
								label={{
									value: `AVG ${fmtRate(avgRate, visibleCurrencies[0], i18n.language)}`,
									position: 'insideTopRight',
									fill: theme.colors.textMuted,
									fontSize: 10,
									fontWeight: 600
								}}
							/>
						)}

						{visibleCurrencies.map((currency, idx) => {
							const colorIdx = currencies.indexOf(currency);
							const color = CHART_COLORS[colorIdx % CHART_COLORS.length];
							return (
								<Area
									key={currency}
									type="monotone"
									dataKey={currency}
									stroke={color}
									strokeWidth={2.5}
									fill={`url(#grad-${currency})`}
									fillOpacity={isNormalized ? 0.5 : 1}
									baseValue={isNormalized ? 0 : undefined}
									dot={false}
									activeDot={{
										r: 5,
										strokeWidth: 2,
										stroke: theme.colors.card,
										fill: color,
										style: { filter: `drop-shadow(0 0 4px ${color}80)` }
									}}
									animationDuration={600}
									animationBegin={idx * 60}
								/>
							);
						})}

						{/* Brush for zoom/pan */}
						{chartData.length > 14 && (
							<Brush
								dataKey="dateFormatted"
								height={28}
								stroke={theme.colors.border}
								fill={theme.colors.bgSecondary}
								travellerWidth={8}
								startIndex={brushStartIndex}
								tickFormatter={() => ''}
							/>
						)}
					</AreaChart>
				</ResponsiveContainer>
			</ChartWrap>
		);
	};

	return (
		<Card
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.2 }}
		>
			<TitleRow>
				<TitleBar />
				<Title>{t('chart.title')}</Title>
			</TitleRow>

			{/* Interactive legend */}
			{currencies.length > 0 && chartData.length > 0 && (
				<LegendRow>
					{currencies.map((code, i) => {
						const color = CHART_COLORS[i % CHART_COLORS.length];
						const isVisible = !hiddenCurrencies.has(code);
						return (
							<LegendItem
								key={code}
								$active={isVisible}
								$color={color}
								onClick={() => toggleCurrency(code)}
								title={getCurrencyName(code, i18n.language)}
							>
								<LegendDot $color={color} />
								{CURRENCY_FLAGS[code]} {code}
							</LegendItem>
						);
					})}
				</LegendRow>
			)}

			{renderContent()}
		</Card>
	);
};

export default CurrencyChart;
