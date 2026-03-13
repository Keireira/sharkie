'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { HistoryResponse } from '@/lib/api';
import type { CompareMode } from '@/hooks/useRates';
import { CURRENCY_FLAGS, getCurrencyName, formatRate } from '@/lib/currencies';

const COMPARE_MODES: CompareMode[] = ['week', 'month', 'quarter', 'halfYear', 'year'];

/* ── Styled ──────────────────────────────── */

const Section = styled(motion.div)`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.md};
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	flex-wrap: wrap;
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

const Title = styled.h2`
	font-size: 16px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	letter-spacing: -0.01em;
`;

const ModeRow = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	margin-left: auto;
	background: ${({ theme }) => theme.colors.bgSecondary};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	padding: 3px;
	border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModeBtn = styled.button<{ $active: boolean }>`
	padding: 4px 12px;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.full};
	font-size: 11px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.15s;
	background: ${({ $active, theme }) => ($active ? theme.colors.accent : 'transparent')};
	color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.textMuted)};

	&:hover {
		color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.text)};
	}

	@media (max-width: 520px) {
		padding: 3px 8px;
		font-size: 10px;
	}
`;

const PeriodInfo = styled.div`
	width: 100%;
	font-size: 12px;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.textMuted};
	text-align: right;

	@media (max-width: 600px) {
		display: none;
	}
`;

const Card = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadow};
	overflow: hidden;
`;

const HeaderRow = styled.div`
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
	background: ${({ theme }) => theme.colors.bgSecondary};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: ${({ theme }) => theme.colors.textMuted};

	@media (max-width: 520px) {
		grid-template-columns: 1.5fr 1fr 1fr 1fr;
		padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
		font-size: 10px;
	}
`;

const Row = styled(motion.div)`
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
	align-items: center;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	transition: background 0.15s;

	&:last-child {
		border-bottom: none;
	}
	&:hover {
		background: ${({ theme }) => theme.colors.bgSecondary};
	}

	@media (max-width: 520px) {
		grid-template-columns: 1.5fr 1fr 1fr 1fr;
		padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
	}
`;

const CurrencyCell = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const Flag = styled.span`
	font-size: 18px;
	@media (max-width: 520px) {
		font-size: 14px;
	}
`;

const CurrencyInfoEl = styled.div`
	display: flex;
	flex-direction: column;
`;

const Code = styled.span`
	font-size: 14px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	@media (max-width: 520px) {
		font-size: 12px;
	}
`;

const Name = styled.span`
	font-size: 11px;
	color: ${({ theme }) => theme.colors.textMuted};
	@media (max-width: 520px) {
		display: none;
	}
`;

const RateCell = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.textSecondary};
	font-variant-numeric: tabular-nums;
	@media (max-width: 520px) {
		font-size: 11px;
	}
`;

const ChangeCell = styled.div<{ $positive: boolean; $zero: boolean }>`
	font-size: 13px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	color: ${({ $zero, $positive, theme }) =>
		$zero ? theme.colors.textMuted : $positive ? theme.colors.success : theme.colors.danger};
	@media (max-width: 520px) {
		font-size: 11px;
	}
`;

const ChangeBar = styled.div<{ $positive: boolean; $width: number }>`
	height: 4px;
	border-radius: 2px;
	margin-top: 4px;
	width: ${({ $width }) => $width}%;
	max-width: 100%;
	background: ${({ $positive, theme }) => ($positive ? theme.colors.success : theme.colors.danger)};
	opacity: 0.5;
`;

const NoData = styled.div`
	padding: ${({ theme }) => theme.spacing.lg};
	text-align: center;
	color: ${({ theme }) => theme.colors.textMuted};
	font-size: 13px;
`;

/* ── Helpers ──────────────────────────────── */

const avg = (values: number[]): number => {
	if (!values.length) return 0;
	return values.reduce((a, b) => a + b, 0) / values.length;
};

const formatPeriodRange = (data?: HistoryResponse): string => {
	if (!data?.data?.length) return '—';
	const dates = data.data.map((d) => d.date).sort();
	const from = dates[0];
	const to = dates[dates.length - 1];
	return `${from.slice(5)} — ${to.slice(5)}, ${from.slice(0, 4)}`;
};

/* ── Component ───────────────────────────── */

interface PeriodComparisonProps {
	currentData?: HistoryResponse;
	compareData?: HistoryResponse;
	currencies: string[];
	compareMode: CompareMode;
	onCompareModeChange: (mode: CompareMode) => void;
}

const PeriodComparison = ({
	currentData,
	compareData,
	currencies,
	compareMode,
	onCompareModeChange
}: PeriodComparisonProps) => {
	const { t, i18n } = useTranslation();

	const rows = useMemo(() => {
		if (!currentData?.data?.length || !compareData?.data?.length) return [];

		return currencies
			.map((code) => {
				const curValues = currentData.data.map((d) => d.rates[code]).filter((v) => v != null);
				const prevValues = compareData.data.map((d) => d.rates[code]).filter((v) => v != null);

				const curAvg = avg(curValues);
				const prevAvg = avg(prevValues);
				const change = prevAvg !== 0 ? ((curAvg - prevAvg) / prevAvg) * 100 : 0;

				return { code, curAvg, prevAvg, change };
			})
			.filter((r) => r.curAvg > 0 && r.prevAvg > 0);
	}, [currentData, compareData, currencies]);

	const maxAbsChange = useMemo(() => Math.max(...rows.map((r) => Math.abs(r.change)), 1), [rows]);

	const currentPeriod = formatPeriodRange(currentData);
	const comparePeriod = formatPeriodRange(compareData);

	if (!currentData?.data?.length) return null;

	return (
		<Section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
			<TitleRow>
				<TitleBar />
				<Title>{t('comparison.title')}</Title>
				<ModeRow>
					{COMPARE_MODES.map((mode) => (
						<ModeBtn key={mode} $active={compareMode === mode} onClick={() => onCompareModeChange(mode)}>
							{t(`comparison.mode.${mode}`)}
						</ModeBtn>
					))}
				</ModeRow>
				{compareData?.data?.length ? (
					<PeriodInfo>
						{currentPeriod} vs {comparePeriod}
					</PeriodInfo>
				) : null}
			</TitleRow>
			<Card>
				<HeaderRow>
					<div>{t('comparison.currency')}</div>
					<div>{t('comparison.current')}</div>
					<div>{t('comparison.previous')}</div>
					<div>{t('comparison.changeCol')}</div>
				</HeaderRow>
				{rows.length === 0 ? (
					<NoData>{t('comparison.noData')}</NoData>
				) : (
					rows.map((row, i) => (
						<Row
							key={row.code}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3, delay: 0.03 * i }}
						>
							<CurrencyCell>
								<Flag>{CURRENCY_FLAGS[row.code] || '💰'}</Flag>
								<CurrencyInfoEl>
									<Code>{row.code}</Code>
									<Name>{getCurrencyName(row.code, i18n.language)}</Name>
								</CurrencyInfoEl>
							</CurrencyCell>
							<RateCell>{formatRate(row.curAvg, row.code, i18n.language)}</RateCell>
							<RateCell>{formatRate(row.prevAvg, row.code, i18n.language)}</RateCell>
							<ChangeCell $positive={row.change > 0} $zero={Math.abs(row.change) < 0.01}>
								{Math.abs(row.change) < 0.01
									? '—'
									: `${row.change > 0 ? '↑' : '↓'} ${Math.abs(row.change).toFixed(2)}%`}
								<ChangeBar $positive={row.change > 0} $width={(Math.abs(row.change) / maxAbsChange) * 100} />
							</ChangeCell>
						</Row>
					))
				)}
			</Card>
		</Section>
	);
};

export default PeriodComparison;
