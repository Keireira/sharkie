'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styled from 'styled-components';
import type { HistoryResponse } from '@/lib/api';
import { CURRENCY_FLAGS, formatRate as fmtRate, getCurrencyName } from '@/lib/currencies';

const CARD_COLORS = [
	'#6366f1',
	'#8b5cf6',
	'#ec4899',
	'#f43f5e',
	'#f97316',
	'#eab308',
	'#22c55e',
	'#14b8a6',
	'#06b6d4',
	'#3b82f6'
];

const Section = styled(motion.div)`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.md};
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const TitleBar = styled.div`
	width: 3px;
	height: 20px;
	border-radius: 2px;
	background: linear-gradient(
		180deg,
		${({ theme }) => theme.colors.gradientStart},
		${({ theme }) => theme.colors.gradientEnd}
	);
`;

const SectionTitle = styled.h2`
	font-size: 16px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	letter-spacing: -0.01em;
`;

const CardWrapper = styled(motion.div)`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadowSm};
	overflow: hidden;
	transition:
		border-color 0.2s,
		box-shadow 0.2s;

	&:hover {
		border-color: ${({ theme }) => theme.colors.borderHover};
		box-shadow: ${({ theme }) => theme.colors.shadow};
	}
`;

const CardHeader = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${({ theme }) => theme.spacing.md};
	background: none;
	border: none;
	cursor: pointer;
	color: inherit;
	font-family: inherit;

	@media (max-width: 520px) {
		padding: ${({ theme }) => theme.spacing.sm};
	}
`;

const HeaderLeft = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const Flag = styled.span`
	font-size: 24px;

	@media (max-width: 520px) {
		font-size: 20px;
	}
`;

const CurrencyCode = styled.span`
	font-size: 16px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};

	@media (max-width: 520px) {
		font-size: 14px;
	}
`;

const CurrencyName = styled.span`
	font-size: 13px;
	color: ${({ theme }) => theme.colors.textMuted};
	font-weight: 500;
	@media (max-width: 520px) {
		display: none;
	}
`;

const CurrentRate = styled.span`
	font-size: 16px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.textSecondary};
	font-variant-numeric: tabular-nums;
	margin-left: ${({ theme }) => theme.spacing.sm};

	@media (max-width: 520px) {
		font-size: 13px;
	}
`;

const HeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.md};
`;

const Change = styled.span<{ $positive: boolean; $zero: boolean }>`
	font-size: 14px;
	font-weight: 600;
	color: ${({ $zero, $positive, theme }) =>
		$zero ? theme.colors.textMuted : $positive ? theme.colors.success : theme.colors.danger};

	@media (max-width: 520px) {
		font-size: 12px;
	}
`;

const ExpandIcon = styled(motion.span)`
	font-size: 14px;
	color: ${({ theme }) => theme.colors.textMuted};
	display: flex;
	align-items: center;
`;

const ExpandedContent = styled(motion.div)`
	overflow: hidden;
`;

const ContentInner = styled.div`
	padding: 0 ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.md};

	@media (max-width: 520px) {
		padding: 0 ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
	}
`;

const ChartContainer = styled.div`
	width: 100%;
	height: 200px;
	margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StatsRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: ${({ theme }) => theme.spacing.sm};

	@media (max-width: 520px) {
		grid-template-columns: repeat(2, 1fr);
	}
`;

const StatItem = styled.div`
	background: ${({ theme }) => theme.colors.bgSecondary};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	padding: ${({ theme }) => theme.spacing.sm};
	text-align: center;
`;

const StatLabel = styled.div`
	font-size: 11px;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.textMuted};
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 4px;
`;

const StatValue = styled.div`
	font-size: 15px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	font-variant-numeric: tabular-nums;

	@media (max-width: 520px) {
		font-size: 13px;
	}
`;

const CustomTooltipContainer = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
`;

const TooltipDate = styled.div`
	font-size: 12px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.textMuted};
	margin-bottom: 4px;
`;

const TooltipValue = styled.div`
	font-size: 14px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HistoryTooltip({ active, payload, label }: any) {
	if (!active || !payload?.length) return null;

	return (
		<CustomTooltipContainer>
			<TooltipDate>{label}</TooltipDate>
			<TooltipValue>{fmtRate(payload[0].value)}</TooltipValue>
		</CustomTooltipContainer>
	);
}

interface CurrencyHistoryProps {
	data?: HistoryResponse;
	currencies: string[];
}

const CurrencyHistory = ({ data, currencies }: CurrencyHistoryProps) => {
	const { t, i18n } = useTranslation();
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	const toggle = (code: string) => {
		setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
	};

	const currencyData = useMemo(() => {
		if (!data?.data?.length) return [];

		return currencies.map((code, index) => {
			const values = data.data.map((d) => d.rates[code]).filter((v) => v != null);
			const current = values[values.length - 1] ?? 0;
			const first = values[0] ?? current;
			const change = first !== 0 ? ((current - first) / first) * 100 : 0;

			const min = Math.min(...values);
			const max = Math.max(...values);
			const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
			const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
			const stdDev = Math.sqrt(variance);
			const volatility = avg !== 0 ? (stdDev / avg) * 100 : 0;

			const chartData = data.data
				.filter((d) => d.rates[code] != null)
				.map((d) => ({
					date: d.date.slice(5),
					value: d.rates[code]
				}));

			const color = CARD_COLORS[index % CARD_COLORS.length];

			return { code, current, change, min, max, avg, volatility, chartData, color };
		});
	}, [data, currencies]);

	if (!currencyData.length) return null;

	return (
		<Section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
			<TitleRow>
				<TitleBar />
				<SectionTitle>{t('history.title')}</SectionTitle>
			</TitleRow>
			{currencyData.map((item, i) => (
				<CardWrapper
					key={item.code}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.05 * i }}
				>
					<CardHeader onClick={() => toggle(item.code)}>
						<HeaderLeft>
							<Flag>{CURRENCY_FLAGS[item.code] || '💰'}</Flag>
							<CurrencyCode>{item.code}</CurrencyCode>
							<CurrencyName>{getCurrencyName(item.code, i18n.language)}</CurrencyName>
							<CurrentRate>{fmtRate(item.current, item.code, i18n.language)}</CurrentRate>
						</HeaderLeft>
						<HeaderRight>
							<Change $positive={item.change > 0} $zero={Math.abs(item.change) < 0.001}>
								{Math.abs(item.change) < 0.001
									? '—'
									: `${item.change > 0 ? '↑' : '↓'} ${Math.abs(item.change).toFixed(2)}%`}
							</Change>
							<ExpandIcon animate={{ rotate: expanded[item.code] ? 180 : 0 }} transition={{ duration: 0.3 }}>
								▼
							</ExpandIcon>
						</HeaderRight>
					</CardHeader>
					<AnimatePresence initial={false}>
						{expanded[item.code] && (
							<ExpandedContent
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
							>
								<ContentInner>
									<ChartContainer>
										<ResponsiveContainer width="100%" height={200}>
											<AreaChart data={item.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
												<defs>
													<linearGradient id={`gradient-${item.code}`} x1="0" y1="0" x2="0" y2="1">
														<stop offset="0%" stopColor={item.color} stopOpacity={0.4} />
														<stop offset="100%" stopColor={item.color} stopOpacity={0.05} />
													</linearGradient>
												</defs>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, rgba(148,163,184,0.1))" />
												<XAxis
													dataKey="date"
													stroke="currentColor"
													tick={{ fontSize: 11, fill: 'currentColor' }}
													tickLine={false}
													axisLine={false}
													interval="preserveStartEnd"
												/>
												<YAxis
													stroke="currentColor"
													tick={{ fontSize: 11, fill: 'currentColor' }}
													tickLine={false}
													axisLine={false}
													width={60}
													domain={['auto', 'auto']}
													tickFormatter={(v: number) =>
														v >= 100 ? v.toFixed(0) : v >= 1 ? v.toFixed(2) : v.toFixed(3)
													}
												/>
												<Tooltip content={<HistoryTooltip />} />
												<Area
													type="monotone"
													dataKey="value"
													stroke={item.color}
													strokeWidth={2}
													fill={`url(#gradient-${item.code})`}
													animationDuration={800}
												/>
											</AreaChart>
										</ResponsiveContainer>
									</ChartContainer>
									<StatsRow>
										<StatItem>
											<StatLabel>{t('history.min')}</StatLabel>
											<StatValue>{fmtRate(item.min, item.code, i18n.language)}</StatValue>
										</StatItem>
										<StatItem>
											<StatLabel>{t('history.max')}</StatLabel>
											<StatValue>{fmtRate(item.max, item.code, i18n.language)}</StatValue>
										</StatItem>
										<StatItem>
											<StatLabel>{t('history.avg')}</StatLabel>
											<StatValue>{fmtRate(item.avg, item.code, i18n.language)}</StatValue>
										</StatItem>
										<StatItem>
											<StatLabel>{t('history.volatility')}</StatLabel>
											<StatValue>{item.volatility.toFixed(2)}%</StatValue>
										</StatItem>
									</StatsRow>
								</ContentInner>
							</ExpandedContent>
						)}
					</AnimatePresence>
				</CardWrapper>
			))}
		</Section>
	);
};

export default CurrencyHistory;
