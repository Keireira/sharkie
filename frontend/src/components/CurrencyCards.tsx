'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { HistoryResponse } from '@/lib/api';
import { CURRENCY_FLAGS, getCurrencyName, formatRate } from '@/lib/currencies';

const CARD_COLORS = [
	'#818cf8', '#a78bfa', '#f472b6', '#fb7185', '#fb923c',
	'#fbbf24', '#34d399', '#2dd4bf', '#22d3ee', '#60a5fa'
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
	background: linear-gradient(180deg, ${({ theme }) => theme.colors.gradientStart}, ${({ theme }) => theme.colors.gradientEnd});
`;

const Title = styled.h2`
	font-size: 16px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	letter-spacing: -0.01em;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: ${({ theme }) => theme.spacing.md};

	@media (max-width: 520px) {
		grid-template-columns: repeat(2, 1fr);
		gap: ${({ theme }) => theme.spacing.sm};
	}
`;

const CardItem = styled(motion.div)<{ $active: boolean }>`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.border)};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	padding: ${({ theme }) => theme.spacing.md};
	box-shadow: ${({ $active, theme }) => ($active ? theme.colors.shadow : theme.colors.shadowSm)};
	overflow: hidden;
	position: relative;
	cursor: pointer;
	transition: box-shadow 0.2s, border-color 0.2s;

	&:hover {
		box-shadow: ${({ theme }) => theme.colors.shadow};
		border-color: ${({ theme }) => theme.colors.borderHover};
	}

	@media (max-width: 520px) {
		padding: ${({ theme }) => theme.spacing.sm};
	}
`;

const CardTop = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Flag = styled.span`
	font-size: 20px;
	@media (max-width: 520px) { font-size: 16px; }
`;

const Code = styled.span`
	font-size: 14px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	letter-spacing: 0.02em;
`;

const Name = styled.div`
	font-size: 11px;
	color: ${({ theme }) => theme.colors.textMuted};
	font-weight: 500;
	margin-bottom: ${({ theme }) => theme.spacing.xs};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const Rate = styled.div`
	font-size: 22px;
	font-weight: 800;
	color: ${({ theme }) => theme.colors.text};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;
	margin-bottom: 2px;

	@media (max-width: 520px) {
		font-size: 17px;
	}
`;

const Change = styled.div<{ $positive: boolean; $zero: boolean }>`
	font-size: 12px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	color: ${({ $zero, $positive, theme }) =>
		$zero ? theme.colors.textMuted : $positive ? theme.colors.success : theme.colors.danger};
`;

const Sparkline = styled.svg`
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	width: 100%;
	height: 36px;
	opacity: 0.2;
`;

const SparklinePath = ({ values, color }: { values: number[]; color: string }) => {
	if (values.length < 2) return null;
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;
	const w = 200;
	const h = 36;
	const step = w / (values.length - 1);
	const points = values.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
	return (
		<Sparkline viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
			<polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
		</Sparkline>
	);
};

// formatRate imported from @/lib/currencies

const ChartBadge = styled.span<{ $active: boolean }>`
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	padding: 2px 8px;
	border-radius: ${({ theme }) => theme.borderRadius.full};
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : 'transparent')};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textMuted)};
	border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.border)};
	margin-left: auto;
	flex-shrink: 0;
`;

interface CurrencyCardsProps {
	data?: HistoryResponse;
	currencies: string[];
	chartCurrencies: string[];
	onToggleChart: (code: string) => void;
}

const CurrencyCards = ({ data, currencies, chartCurrencies, onToggleChart }: CurrencyCardsProps) => {
	const { t, i18n } = useTranslation();

	const cardData = useMemo(() => {
		if (!data?.data?.length) return [];
		return currencies.map((code) => {
			const values = data.data.map((d) => d.rates[code]).filter((v) => v != null);
			const current = values[values.length - 1] ?? 0;
			const first = values[0] ?? current;
			const change = first !== 0 ? ((current - first) / first) * 100 : 0;
			return { code, current, change, values };
		});
	}, [data, currencies]);

	if (!cardData.length) return null;

	return (
		<Section
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4, delay: 0.3 }}
		>
			<TitleRow>
				<TitleBar />
				<Title>{t('cards.title')}</Title>
			</TitleRow>
			<Grid>
				{cardData.map((item, i) => {
					const isOnChart = chartCurrencies.includes(item.code);
					return (
						<CardItem
							key={item.code}
							$active={isOnChart}
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.35, delay: 0.04 * i }}
							whileHover={{ y: -3, transition: { duration: 0.15 } }}
							onClick={() => onToggleChart(item.code)}
						>
							<CardTop>
								<Flag>{CURRENCY_FLAGS[item.code] || '💰'}</Flag>
								<Code>{item.code}</Code>
								<ChartBadge $active={isOnChart}>
									{isOnChart ? '✓ chart' : '+ chart'}
								</ChartBadge>
							</CardTop>
							<Name>{getCurrencyName(item.code, i18n.language)}</Name>
							<Rate>{formatRate(item.current, item.code, i18n.language)}</Rate>
							<Change
								$positive={item.change > 0}
								$zero={Math.abs(item.change) < 0.001}
							>
								{Math.abs(item.change) < 0.001
									? t('cards.noChange')
									: `${item.change > 0 ? '↑' : '↓'} ${Math.abs(item.change).toFixed(2)}%`}
							</Change>
							<SparklinePath values={item.values} color={CARD_COLORS[i % CARD_COLORS.length]} />
						</CardItem>
					);
				})}
			</Grid>
		</Section>
	);
};

export default CurrencyCards;
