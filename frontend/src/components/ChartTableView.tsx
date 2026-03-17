'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { HistoryResponse } from '@/lib/api';
import CurrencyChart from './CurrencyChart';
import RatesTable from './RatesTable';

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
`;

const ToggleBar = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 7px 16px;
	border: 1.5px solid ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.border)};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : 'transparent')};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textMuted)};
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}

	svg {
		width: 16px;
		height: 16px;
	}
`;

interface ChartTableViewProps {
	data?: HistoryResponse;
	isLoading: boolean;
	isError: boolean;
	error?: Error | null;
	chartCurrencies: string[];
	tableCurrencies: string[];
}

const ChartTableView = ({ data, isLoading, isError, error, chartCurrencies }: ChartTableViewProps) => {
	const { t } = useTranslation();
	const [view, setView] = useState<'chart' | 'table'>('chart');

	return (
		<Wrapper>
			<ToggleBar>
				<ToggleBtn $active={view === 'chart'} onClick={() => setView('chart')}>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
					</svg>
					{t('chart.title', 'Chart')}
				</ToggleBtn>
				<ToggleBtn $active={view === 'table'} onClick={() => setView('table')}>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<line x1="3" y1="9" x2="21" y2="9" />
						<line x1="3" y1="15" x2="21" y2="15" />
						<line x1="9" y1="3" x2="9" y2="21" />
						<line x1="15" y1="3" x2="15" y2="21" />
					</svg>
					{t('table.title', 'Table')}
				</ToggleBtn>
			</ToggleBar>

			{view === 'chart' ? (
				<CurrencyChart data={data} isLoading={isLoading} isError={isError} error={error} currencies={chartCurrencies} />
			) : (
				<RatesTable data={data} currencies={chartCurrencies} isLoading={isLoading} />
			)}
		</Wrapper>
	);
};

export default ChartTableView;
