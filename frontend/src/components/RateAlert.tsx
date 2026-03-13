'use client';

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import type { HistoryResponse } from '@/lib/api';
import { CURRENCY_FLAGS, getCurrencyName } from '@/lib/currencies';

/* ── Styled ──────────────────────────────────── */

const Card = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	padding: ${({ theme }) => theme.spacing.lg};
	box-shadow: ${({ theme }) => theme.colors.shadowSm};
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.md};
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const TitleLeft = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const TitleBar = styled.div`
	width: 3px;
	height: 18px;
	border-radius: 2px;
	background: linear-gradient(180deg, ${({ theme }) => theme.colors.gradientStart}, ${({ theme }) => theme.colors.gradientEnd});
`;

const Title = styled.h3`
	font-size: 14px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	margin: 0;
`;

const DirectionToggle = styled.button<{ $mode: string }>`
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ $mode, theme }) => $mode === 'up' ? theme.colors.success : $mode === 'down' ? theme.colors.danger : theme.colors.textMuted};
	padding: 4px 10px;
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
	}
`;

/* ── Big display ─────────────────────────────── */

const DisplayArea = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${({ theme }) => theme.spacing.lg};
	padding: ${({ theme }) => theme.spacing.md} 0;
`;

const StepButton = styled.button`
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 50%;
	background: transparent;
	color: ${({ theme }) => theme.colors.textSecondary};
	font-size: 22px;
	font-weight: 300;
	cursor: pointer;
	transition: all 0.15s;
	flex-shrink: 0;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}

	&:active {
		transform: scale(0.95);
	}
`;

const BigValue = styled.div`
	font-size: 52px;
	font-weight: 900;
	color: ${({ theme }) => theme.colors.text};
	letter-spacing: -0.03em;
	font-variant-numeric: tabular-nums;
	line-height: 1;
	text-align: center;
	min-width: 100px;
`;

const SubLabel = styled.div`
	text-align: center;
	font-size: 14px;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.textMuted};
	margin-top: -4px;
`;

/* ── Presets ──────────────────────────────────── */

const PresetsRow = styled.div`
	display: flex;
	gap: 6px;
`;

const Preset = styled.button<{ $active: boolean }>`
	flex: 1;
	padding: 8px 0;
	border: 1px solid ${({ $active, theme }) => $active ? theme.colors.accent : theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	background: ${({ $active, theme }) => $active ? theme.colors.accentGlow : theme.colors.bgSecondary};
	color: ${({ $active, theme }) => $active ? theme.colors.accent : theme.colors.textSecondary};
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}
`;

/* ── Results ─────────────────────────────────── */

const ResultsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	max-height: 200px;
	overflow-y: auto;
	scrollbar-width: thin;
`;

const ResultItem = styled.div<{ $positive: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	background: ${({ theme }) => theme.colors.bgSecondary};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	font-size: 13px;
`;

const ResultFlag = styled.span`
	font-size: 18px;
	line-height: 1;
`;

const ResultCode = styled.span`
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	min-width: 36px;
`;

const ResultName = styled.span`
	color: ${({ theme }) => theme.colors.textMuted};
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 12px;
`;

const ResultChange = styled.span<{ $positive: boolean }>`
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	color: ${({ $positive, theme }) => $positive ? theme.colors.success : theme.colors.danger};
	flex-shrink: 0;
`;

const EmptyState = styled.div`
	text-align: center;
	padding: ${({ theme }) => theme.spacing.md};
	color: ${({ theme }) => theme.colors.textMuted};
	font-size: 13px;
`;

const MatchCount = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.textMuted};
	background: ${({ theme }) => theme.colors.bgSecondary};
	padding: 2px 8px;
	border-radius: ${({ theme }) => theme.borderRadius.full};
`;

/* ── Component ───────────────────────────────── */

interface RateAlertProps {
	data?: HistoryResponse;
	currencies: string[];
}

type Direction = 'up' | 'down' | 'both';

const PRESETS = [1, 2, 5, 10];

const RateAlert = ({ data, currencies }: RateAlertProps) => {
	const { i18n } = useTranslation();
	const [threshold, setThreshold] = useState(5);
	const [direction, setDirection] = useState<Direction>('both');

	const results = useMemo(() => {
		if (!data?.data?.length || data.data.length < 2) return [];

		const first = data.data[0].rates;
		const last = data.data[data.data.length - 1].rates;

		return currencies
			.map((code) => {
				const startRate = first[code];
				const endRate = last[code];
				if (!startRate || !endRate) return null;
				const change = ((endRate - startRate) / startRate) * 100;
				return { code, change };
			})
			.filter((r): r is { code: string; change: number } => {
				if (!r) return false;
				const absChange = Math.abs(r.change);
				if (absChange < threshold) return false;
				if (direction === 'up') return r.change > 0;
				if (direction === 'down') return r.change < 0;
				return true;
			})
			.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
	}, [data, currencies, threshold, direction]);

	const directionLabel = direction === 'up'
		? (i18n.language === 'ru' ? 'рост' : 'gains')
		: direction === 'down'
			? (i18n.language === 'ru' ? 'падение' : 'losses')
			: (i18n.language === 'ru' ? 'все' : 'all');

	const cycleDirection = () => {
		setDirection((d) => d === 'both' ? 'up' : d === 'up' ? 'down' : 'both');
	};

	const decrement = () => setThreshold((v) => Math.max(0.5, +(v - 0.5).toFixed(1)));
	const increment = () => setThreshold((v) => Math.min(50, +(v + 0.5).toFixed(1)));

	return (
		<Card>
			<TitleRow>
				<TitleLeft>
					<TitleBar />
					<Title>{i18n.language === 'ru' ? 'Движения курсов' : 'Rate Movers'}</Title>
					<MatchCount>{results.length}</MatchCount>
				</TitleLeft>
				<DirectionToggle $mode={direction} onClick={cycleDirection}>
					{direction === 'up' ? '↑' : direction === 'down' ? '↓' : '↕'} {directionLabel}
				</DirectionToggle>
			</TitleRow>

			<DisplayArea>
				<StepButton onClick={decrement}>−</StepButton>
				<div>
					<BigValue>{threshold % 1 === 0 ? threshold : threshold.toFixed(1)}%</BigValue>
					<SubLabel>{i18n.language === 'ru' ? 'и более' : 'or Higher'}</SubLabel>
				</div>
				<StepButton onClick={increment}>+</StepButton>
			</DisplayArea>

			<PresetsRow>
				{PRESETS.map((p) => (
					<Preset key={p} $active={threshold === p} onClick={() => setThreshold(p)}>
						{p}%
					</Preset>
				))}
			</PresetsRow>

			<ResultsList>
				{results.length === 0 ? (
					<EmptyState>
						{i18n.language === 'ru'
							? `Нет валют с изменением ≥ ${threshold}%`
							: `No currencies moved ≥ ${threshold}%`}
					</EmptyState>
				) : (
					results.map(({ code, change }) => (
						<ResultItem key={code} $positive={change > 0}>
							<ResultFlag>{CURRENCY_FLAGS[code] || ''}</ResultFlag>
							<ResultCode>{code}</ResultCode>
							<ResultName>{getCurrencyName(code, i18n.language)}</ResultName>
							<ResultChange $positive={change > 0}>
								{change > 0 ? '+' : ''}{change.toFixed(2)}%
							</ResultChange>
						</ResultItem>
					))
				)}
			</ResultsList>
		</Card>
	);
};

export default RateAlert;
