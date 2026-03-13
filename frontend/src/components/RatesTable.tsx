'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { HistoryResponse } from '@/lib/api';
import { getCurrencyName, formatRate } from '@/lib/currencies';

const ROW_HEIGHT = 40;
const MAX_HEIGHT = 480;

const TableSection = styled(motion.div)`
	display: flex;
	flex-direction: column;
`;

const TableCard = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadow};
	overflow: hidden;
`;

const ScrollWrapper = styled.div`
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;

	&::-webkit-scrollbar {
		height: 6px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: ${({ theme }) => theme.colors.border};
		border-radius: ${({ theme }) => theme.borderRadius.full};
	}
`;

const TableEl = styled.table`
	width: 100%;
	border-collapse: collapse;
	min-width: 500px;
`;

const Thead = styled.thead`
	position: sticky;
	top: 0;
	z-index: 1;
`;

const Th = styled.th<{ $highlighted?: boolean }>`
	padding: 10px 14px;
	text-align: right;
	font-size: 13px;
	font-weight: 700;
	color: ${({ $highlighted, theme }) => ($highlighted ? theme.colors.accent : theme.colors.textSecondary)};
	background: ${({ $highlighted, theme }) => ($highlighted ? theme.colors.accentGlow : theme.colors.bgSecondary)};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	white-space: nowrap;
	letter-spacing: 0.02em;
	transition: color 0.1s, background 0.1s;

	&:first-child {
		text-align: left;
	}
`;

const VirtualBody = styled.div`
	overflow-y: auto;
	max-height: ${MAX_HEIGHT}px;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: ${({ theme }) => theme.colors.border};
		border-radius: ${({ theme }) => theme.borderRadius.full};
	}
`;

const VRow = styled.div<{ $highlighted?: boolean }>`
	display: flex;
	align-items: center;
	transition: background 0.1s;
	background: ${({ $highlighted, theme }) => ($highlighted ? theme.colors.cardHover : 'transparent')};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const VCell = styled.div<{ $colHighlight?: boolean; $crosshair?: boolean; $first?: boolean }>`
	flex: 1;
	min-width: 90px;
	padding: 0 14px;
	height: ${ROW_HEIGHT}px;
	display: flex;
	align-items: center;
	justify-content: ${({ $first }) => ($first ? 'flex-start' : 'flex-end')};
	font-size: 14px;
	font-weight: ${({ $first }) => ($first ? 600 : 500)};
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	color: ${({ $first, theme }) => ($first ? theme.colors.textSecondary : theme.colors.text)};
	background: ${({ $crosshair, $colHighlight, theme }) =>
		$crosshair
			? theme.colors.accentGlow
			: $colHighlight
				? theme.colors.cardHover
				: 'transparent'};
	transition: background 0.1s;
`;

const RateSpan = styled.span<{ $trend: 'up' | 'down' | 'neutral' }>`
	color: ${({ $trend, theme }) =>
		$trend === 'up'
			? theme.colors.success
			: $trend === 'down'
				? theme.colors.danger
				: theme.colors.text};
`;

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const MONTHS_JA = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MONTHS_MAP: Record<string, string[]> = { en: MONTHS_EN, ru: MONTHS_RU, ja: MONTHS_JA, es: MONTHS_ES };

const formatDateDMY = (dateStr: string, lang: string): string => {
	const parts = dateStr.split('-');
	if (parts.length < 3) return dateStr;
	const day = parseInt(parts[2], 10);
	const month = parseInt(parts[1], 10) - 1;
	const year = parts[0];
	const months = MONTHS_MAP[lang] || MONTHS_EN;
	return `${day} ${months[month]} ${year}`;
};

interface RatesTableProps {
	data?: HistoryResponse;
	currencies: string[];
}

const RatesTable = ({ data, currencies }: RatesTableProps) => {
	const { t, i18n } = useTranslation();
	const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
	const parentRef = useRef<HTMLDivElement>(null);

	const handleCellEnter = useCallback((row: number, col: number) => {
		setHoverCell({ row, col });
	}, []);

	const handleLeave = useCallback(() => {
		setHoverCell(null);
	}, []);

	const rows = useMemo(() => {
		if (!data?.data?.length) return [];

		const sorted = [...data.data].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);

		return sorted.map((entry, i) => {
			const prev = sorted[i + 1];
			const cells = currencies.map((code) => {
				const value = entry.rates[code];
				let trend: 'up' | 'down' | 'neutral' = 'neutral';
				if (prev && prev.rates[code] != null && value != null) {
					if (value > prev.rates[code]) trend = 'up';
					else if (value < prev.rates[code]) trend = 'down';
				}
				return { code, value, trend };
			});
			return { date: entry.date, cells };
		});
	}, [data, currencies]);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 10
	});

	if (!rows.length) return null;

	return (
		<TableSection
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5, delay: 0.4 }}
		>
			<TableCard>
				<ScrollWrapper>
					<TableEl>
						<Thead>
							<tr>
								<Th $highlighted={hoverCell?.col === -1}>{t('table.date')}</Th>
								{currencies.map((code, ci) => (
									<Th
										key={code}
										title={getCurrencyName(code, i18n.language)}
										$highlighted={hoverCell?.col === ci}
									>
										{code}
									</Th>
								))}
							</tr>
						</Thead>
					</TableEl>

					<VirtualBody ref={parentRef} onMouseLeave={handleLeave}>
						<div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
							{virtualizer.getVirtualItems().map((virtualRow) => {
								const row = rows[virtualRow.index];
								const ri = virtualRow.index;
								return (
									<VRow
										key={row.date}
										$highlighted={hoverCell?.row === ri}
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											width: '100%',
											height: ROW_HEIGHT,
											transform: `translateY(${virtualRow.start}px)`
										}}
									>
										<VCell
											$first
											$colHighlight={hoverCell?.col === -1 && hoverCell?.row !== ri}
											$crosshair={hoverCell?.row === ri && hoverCell?.col === -1}
											onMouseEnter={() => handleCellEnter(ri, -1)}
										>
											{formatDateDMY(row.date, i18n.language)}
										</VCell>
										{row.cells.map((cell, ci) => (
											<VCell
												key={cell.code}
												$colHighlight={hoverCell?.col === ci && hoverCell?.row !== ri}
												$crosshair={hoverCell?.row === ri && hoverCell?.col === ci}
												onMouseEnter={() => handleCellEnter(ri, ci)}
											>
												{cell.value != null ? (
													<RateSpan $trend={cell.trend}>
														{formatRate(cell.value, cell.code, i18n.language)}
													</RateSpan>
												) : (
													'—'
												)}
											</VCell>
										))}
									</VRow>
								);
							})}
						</div>
					</VirtualBody>
				</ScrollWrapper>
			</TableCard>
		</TableSection>
	);
};

export default RatesTable;
