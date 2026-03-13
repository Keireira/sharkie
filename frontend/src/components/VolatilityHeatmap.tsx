'use client';

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { HistoryResponse } from '@/lib/api';
import { CURRENCY_FLAGS, getCurrencyName } from '@/lib/currencies';

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

const Card = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadow};
	padding: ${({ theme }) => theme.spacing.lg};
	overflow-x: auto;

	@media (max-width: 768px) {
		padding: ${({ theme }) => theme.spacing.md};
	}
`;

const GridWrap = styled.div`
	position: relative;
`;

const Grid = styled.div<{ $cols: number }>`
	display: grid;
	grid-template-columns: 80px repeat(${({ $cols }) => $cols}, 1fr);
	gap: 3px;
	min-width: fit-content;

	@media (max-width: 600px) {
		grid-template-columns: 60px repeat(${({ $cols }) => $cols}, 1fr);
		gap: 2px;
	}
`;

const DateHeader = styled.span`
	font-size: 10px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.textMuted};
	text-align: center;
	padding: 0 2px 6px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const CornerCell = styled.div`
	/* empty top-left corner */
`;

const CurrLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	padding-right: 8px;
	height: 36px;

	@media (max-width: 600px) {
		height: 30px;
		gap: 4px;
	}
`;

const LabelFlag = styled.span`
	font-size: 16px;
	line-height: 1;

	@media (max-width: 600px) {
		font-size: 14px;
	}
`;

const LabelCode = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};

	@media (max-width: 600px) {
		font-size: 11px;
	}
`;

const Cell = styled.div<{ $bg: string; $hatched: boolean }>`
	height: 36px;
	border-radius: 6px;
	background: ${({ $bg }) => $bg};
	cursor: pointer;
	transition: transform 0.1s, box-shadow 0.1s;
	position: relative;
	overflow: hidden;

	${({ $hatched, $bg }) =>
		$hatched
			? `
		background: ${$bg};
		background-image: repeating-linear-gradient(
			-45deg,
			transparent,
			transparent 3px,
			rgba(0,0,0,0.15) 3px,
			rgba(0,0,0,0.15) 4px
		);
	`
			: ''}

	&:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0,0,0,0.25);
		z-index: 2;
	}

	@media (max-width: 600px) {
		height: 30px;
		border-radius: 4px;
	}
`;

const TooltipBox = styled(motion.div)`
	position: fixed;
	z-index: 9999;
	pointer-events: none;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 10px;
	padding: 8px 12px;
	box-shadow: 0 8px 24px rgba(0,0,0,0.3);
	white-space: nowrap;
	display: flex;
	flex-direction: column;
	gap: 2px;
	transform: translate(-50%, -100%);
	margin-top: -12px;
`;

const TtLabel = styled.span`
	font-size: 13px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
`;

const TtSub = styled.span`
	font-size: 11px;
	color: ${({ theme }) => theme.colors.textMuted};
`;

const LegendRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: ${({ theme }) => theme.spacing.md};
	padding-top: ${({ theme }) => theme.spacing.sm};
	border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const LegendLabel = styled.span`
	font-size: 11px;
	color: ${({ theme }) => theme.colors.textMuted};
	font-weight: 600;
	white-space: nowrap;
`;

const LegendSwatches = styled.div`
	display: flex;
	align-items: center;
	gap: 3px;
`;

const LegendSwatch = styled.div<{ $bg: string; $hatched: boolean }>`
	width: 16px;
	height: 12px;
	border-radius: 3px;
	background: ${({ $bg }) => $bg};

	${({ $hatched, $bg }) =>
		$hatched
			? `
		background: ${$bg};
		background-image: repeating-linear-gradient(
			-45deg,
			transparent,
			transparent 2px,
			rgba(0,0,0,0.15) 2px,
			rgba(0,0,0,0.15) 3px
		);
	`
			: ''}
`;

/* Color logic: purple gradient inspired by the reference */
function changeColor(absPct: number, maxPct: number): { bg: string; hatched: boolean } {
	if (maxPct === 0) return { bg: 'rgba(139, 92, 246, 0.05)', hatched: true };
	const t = Math.min(absPct / maxPct, 1);

	if (t < 0.05) return { bg: 'rgba(139, 92, 246, 0.08)', hatched: true };
	if (t < 0.15) return { bg: 'rgba(139, 92, 246, 0.15)', hatched: true };
	if (t < 0.3) return { bg: 'rgba(139, 92, 246, 0.25)', hatched: false };
	if (t < 0.5) return { bg: 'rgba(139, 92, 246, 0.4)', hatched: false };
	if (t < 0.7) return { bg: 'rgba(168, 85, 247, 0.6)', hatched: false };
	if (t < 0.85) return { bg: 'rgba(168, 85, 247, 0.8)', hatched: false };
	return { bg: 'rgba(192, 132, 252, 0.95)', hatched: false };
}

interface TooltipInfo {
	code: string;
	date: string;
	change: number;
	x: number;
	y: number;
}

interface VolatilityHeatmapProps {
	data?: HistoryResponse;
	currencies: string[];
}

const MAX_COLS = 14;

const VolatilityHeatmap = ({ data, currencies }: VolatilityHeatmapProps) => {
	const { t, i18n } = useTranslation();
	const [tip, setTip] = useState<TooltipInfo | null>(null);

	const { dates, matrix, maxChange } = useMemo(() => {
		if (!data?.data?.length || data.data.length < 2)
			return { dates: [] as string[], matrix: [] as number[][], maxChange: 0 };

		const sorted = [...data.data].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);

		// Sample dates to fit MAX_COLS
		let sampled = sorted;
		if (sorted.length > MAX_COLS + 1) {
			const step = (sorted.length - 1) / MAX_COLS;
			sampled = [sorted[0]];
			for (let i = 1; i <= MAX_COLS; i++) {
				sampled.push(sorted[Math.round(i * step)]);
			}
		}

		// Compute daily % changes
		const changeDates: string[] = [];
		const mat: number[][] = [];
		let maxC = 0;

		for (let d = 1; d < sampled.length; d++) {
			changeDates.push(sampled[d].date);
			const row: number[] = [];
			for (const code of currencies) {
				const prev = sampled[d - 1].rates[code];
				const curr = sampled[d].rates[code];
				const ch = prev && curr ? ((curr - prev) / prev) * 100 : 0;
				row.push(ch);
				if (Math.abs(ch) > maxC) maxC = Math.abs(ch);
			}
			mat.push(row);
		}

		// Transpose: matrix[currency][date]
		const transposed = currencies.map((_, ci) => mat.map((row) => row[ci]));

		return { dates: changeDates, matrix: transposed, maxChange: maxC };
	}, [data, currencies]);

	if (!dates.length || !matrix.length) return null;

	const locale = i18n.language === 'ja' ? 'ja-JP' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'es' ? 'es-ES' : 'en-US';

	return (
		<Section
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5, delay: 0.3 }}
		>
			<TitleRow>
				<TitleBar />
				<Title>{t('heatmap.title', 'Volatility Heatmap')}</Title>
			</TitleRow>
			<Card>
				<GridWrap data-heatgrid>
					<Grid $cols={dates.length}>
						{/* Header row: corner + dates */}
						<CornerCell />
						{dates.map((d) => (
							<DateHeader key={d}>
								{fmtDate(d, locale)}
							</DateHeader>
						))}

						{/* Data rows */}
						{currencies.map((code, ci) => (
							<React.Fragment key={code}>
								<CurrLabel>
									<LabelFlag>{CURRENCY_FLAGS[code] || ''}</LabelFlag>
									<LabelCode>{code}</LabelCode>
								</CurrLabel>
								{matrix[ci]?.map((change, di) => {
									const abs = Math.abs(change);
									const { bg, hatched } = changeColor(abs, maxChange);
									return (
										<Cell
											key={`${code}-${dates[di]}`}
											$bg={bg}
											$hatched={hatched}
											onMouseEnter={(e) => {
												const rect = (e.target as HTMLElement).getBoundingClientRect();
												setTip({
													code,
													date: dates[di],
													change,
													x: rect.left + rect.width / 2,
													y: rect.top
												});
											}}
											onMouseLeave={() => setTip(null)}
										/>
									);
								})}
							</React.Fragment>
						))}
					</Grid>

					{tip && (
						<TooltipBox
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							style={{ left: tip.x, top: tip.y }}
							data-tooltip
						>
							<TtLabel>
								{CURRENCY_FLAGS[tip.code]} {tip.code} {tip.change >= 0 ? '+' : ''}{tip.change.toFixed(3)}%
							</TtLabel>
							<TtSub>{getCurrencyName(tip.code, i18n.language)} — {fmtDate(tip.date, locale)}</TtSub>
						</TooltipBox>
					)}
				</GridWrap>

				<LegendRow>
					<LegendLabel>0</LegendLabel>
					<LegendSwatches>
						<LegendSwatch $bg="rgba(139, 92, 246, 0.08)" $hatched={true} />
						<LegendSwatch $bg="rgba(139, 92, 246, 0.15)" $hatched={true} />
						<LegendSwatch $bg="rgba(139, 92, 246, 0.25)" $hatched={false} />
						<LegendSwatch $bg="rgba(139, 92, 246, 0.4)" $hatched={false} />
						<LegendSwatch $bg="rgba(168, 85, 247, 0.6)" $hatched={false} />
						<LegendSwatch $bg="rgba(168, 85, 247, 0.8)" $hatched={false} />
						<LegendSwatch $bg="rgba(192, 132, 252, 0.95)" $hatched={false} />
					</LegendSwatches>
					<LegendLabel>{maxChange.toFixed(1)}%</LegendLabel>
				</LegendRow>
			</Card>
		</Section>
	);
};

function fmtDate(dateStr: string, locale: string): string {
	try {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
	} catch {
		return dateStr;
	}
}

export default VolatilityHeatmap;
