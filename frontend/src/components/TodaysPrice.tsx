'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CURRENCY_FLAGS, getCurrencyName } from '@/lib/currencies';
import type { HistoryResponse } from '@/lib/api';

/* ── Ticker strip — no card, open layout ─────────────── */

const Strip = styled(motion.div)`
	display: flex;
	align-items: stretch;
	gap: 0;
	overflow-x: auto;
	scrollbar-width: none;
	&::-webkit-scrollbar { display: none; }
`;

const Item = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 18px 24px;
	flex-shrink: 0;
	position: relative;

	&:not(:last-child)::after {
		content: '';
		position: absolute;
		right: 0;
		top: 20%;
		bottom: 20%;
		width: 1px;
		background: ${({ theme }) => theme.colors.border};
	}

	@media (max-width: 768px) {
		padding: 14px 16px;
		gap: 10px;
	}
`;

const Flag = styled.span`
	font-size: 32px;
	line-height: 1;

	@media (max-width: 768px) {
		font-size: 26px;
	}
`;

const Info = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const CodeRow = styled.div`
	display: flex;
	align-items: baseline;
	gap: 8px;
`;

const Code = styled.span`
	font-size: 15px;
	font-weight: 800;
	color: ${({ theme }) => theme.colors.text};
	letter-spacing: -0.01em;
`;

const Rate = styled.span`
	font-size: 20px;
	font-weight: 800;
	color: ${({ theme }) => theme.colors.text};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.03em;

	@media (max-width: 768px) {
		font-size: 17px;
	}
`;

const SubRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const Name = styled.span`
	font-size: 11px;
	color: ${({ theme }) => theme.colors.textMuted};
	white-space: nowrap;
`;

const Change = styled.span<{ $positive: boolean; $zero: boolean }>`
	font-size: 11px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	color: ${({ $zero, $positive, theme }) =>
		$zero ? theme.colors.textMuted : $positive ? theme.colors.success : theme.colors.danger};
`;

/* ── Helpers ─────────────────────────────── */

const formatRate = (rate: number): string => {
	if (rate >= 1000) return rate.toLocaleString('en-US', { maximumFractionDigits: 2 });
	if (rate >= 1) return rate.toFixed(3);
	return rate.toFixed(4);
};

/* ── Component ─────────────────────────────── */

interface TodaysPriceProps {
	data?: HistoryResponse;
	baseCurrency: string;
	currencies: string[];
}

const TodaysPrice = ({ data, currencies }: TodaysPriceProps) => {
	const { i18n } = useTranslation();

	const rows = useMemo(() => {
		if (!data?.data?.length) return [];

		const latest = data.data[data.data.length - 1];
		const prev = data.data.length > 1 ? data.data[data.data.length - 2] : null;

		return currencies.map((code) => {
			const rate = latest.rates[code];
			const prevRate = prev?.rates[code];
			let change = 0;
			if (rate != null && prevRate != null && prevRate !== 0) {
				change = ((rate - prevRate) / prevRate) * 100;
			}
			return { code, rate, change };
		});
	}, [data, currencies]);

	if (!rows.length) return null;

	return (
		<Strip
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			{rows.map((row) => (
				<Item key={row.code}>
					<Flag>{CURRENCY_FLAGS[row.code]}</Flag>
					<Info>
						<CodeRow>
							<Code>{row.code}</Code>
							<Rate>{row.rate != null ? formatRate(row.rate) : '—'}</Rate>
						</CodeRow>
						<SubRow>
							<Name>{getCurrencyName(row.code, i18n.language)}</Name>
							<Change
								$positive={row.change > 0}
								$zero={Math.abs(row.change) < 0.001}
							>
								{Math.abs(row.change) < 0.001
									? '—'
									: `${row.change > 0 ? '↑' : '↓'} ${Math.abs(row.change).toFixed(2)}%`}
							</Change>
						</SubRow>
					</Info>
				</Item>
			))}
		</Strip>
	);
};

export default TodaysPrice;
