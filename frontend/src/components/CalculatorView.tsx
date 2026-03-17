'use client';

import { format, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import CurrencyChart from '@/components/CurrencyChart';
import RatesTable from '@/components/RatesTable';
import { useRangeRates, useRate } from '@/hooks/useRateStore';
import { useCurrenciesQuery } from '@/hooks/useRates';
import type { HistoryResponse } from '@/lib/api';
import {
	ALL_CATEGORIES,
	CATEGORY_ICONS,
	CATEGORY_LABELS_EN,
	CATEGORY_LABELS_ES,
	CATEGORY_LABELS_JA,
	CATEGORY_LABELS_RU,
	CURRENCY_FLAGS,
	CURRENCY_SYMBOLS,
	type CurrencyCategory,
	getCurrencyCategory,
	getCurrencyName,
	matchesCurrencySearch
} from '@/lib/currencies';
import { useAppSettings } from '@/providers/Providers';

/* ── Layout ──────────────────────────────── */

const Container = styled(motion.div)`
	max-width: 75%;
	margin: 0 auto;
	padding: ${({ theme }) => theme.spacing.lg};
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.lg};

	@media (max-width: 768px) {
		max-width: 100%;
		padding: ${({ theme }) => theme.spacing.md};
		gap: ${({ theme }) => theme.spacing.md};
	}
`;

const CalcCard = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadow};
	overflow: hidden;
`;

/* ── Header ──────────────────────────────── */

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${({ theme }) => theme.spacing.md};
	padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${({ theme }) => theme.spacing.md};
	width: 100%;
`;

const CurrPill = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: ${({ theme }) => theme.colors.bgSecondary};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	cursor: pointer;
	position: relative;
	user-select: none;
	flex: 1;
	justify-content: center;
	min-width: 0;
	transition: border-color 0.15s;
	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
	}
`;

const CurrFlag = styled.span`
	font-size: 20px;
	line-height: 1;
`;

const CurrCode = styled.span`
	font-size: 15px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
`;

const CurrChevron = styled.span`
	font-size: 10px;
	opacity: 0.4;
	margin-left: 2px;
`;

const SwapIcon = styled(motion.button)`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border: none;
	background: transparent;
	color: ${({ theme }) => theme.colors.textMuted};
	cursor: pointer;
	font-size: 20px;
	flex-shrink: 0;
	&:hover {
		color: ${({ theme }) => theme.colors.accent};
	}
`;

/* ── Amount ──────────────────────────────── */

const AmountBlock = styled.div<{ $active?: boolean }>`
	padding: 20px 24px;
	cursor: ${({ $active }) => ($active ? 'text' : 'default')};
	&:first-of-type {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	}
`;

const AmountRow = styled.div`
	display: flex;
	align-items: baseline;
`;

const AmountSymbol = styled.span`
	font-size: 24px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.textMuted};
	margin-right: 6px;
	@media (max-width: 768px) {
		font-size: 20px;
	}
`;

const AmountInput = styled.input`
	flex: 1;
	border: none;
	background: transparent;
	color: ${({ theme }) => theme.colors.text};
	font-size: 40px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.03em;
	outline: none;
	min-width: 0;
	&::placeholder {
		color: ${({ theme }) => theme.colors.textMuted};
	}
	@media (max-width: 768px) {
		font-size: 32px;
	}
`;

const AmountDisplay = styled.div`
	flex: 1;
	font-size: 40px;
	font-weight: 800;
	color: ${({ theme }) => theme.colors.text};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.03em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	@media (max-width: 768px) {
		font-size: 32px;
	}
`;

const RateHint = styled.div`
	font-size: 13px;
	color: ${({ theme }) => theme.colors.textMuted};
	margin-top: 8px;
	font-weight: 500;
`;

const LoadingDots = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: ${({ theme }) => theme.colors.accent};
		opacity: 0.4;
		animation: cvPulse 1.2s ease-in-out infinite;
	}
	span:nth-child(2) {
		animation-delay: 0.2s;
	}
	span:nth-child(3) {
		animation-delay: 0.4s;
	}
	@keyframes cvPulse {
		0%,
		80%,
		100% {
			opacity: 0.2;
			transform: scale(0.8);
		}
		40% {
			opacity: 1;
			transform: scale(1.1);
		}
	}
`;

/* ── Date ──────────────────────────────── */

const DateRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px ${({ theme }) => theme.spacing.lg};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	position: relative;
`;

const DateButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 12px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.textSecondary};
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s;
	font-family: inherit;
	position: relative;
	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}
	svg {
		width: 14px;
		height: 14px;
	}
`;

const NativeDateInput = styled.input`
	position: absolute;
	inset: 0;
	opacity: 0;
	width: 100%;
	height: 100%;
	cursor: pointer;
	z-index: 1;
	-webkit-appearance: none;
	font-size: 16px;
`;

/* ── Dropdown ──────────────────────────────── */

const DropdownWrapper = styled.div`
	position: fixed;
	width: 280px;
	max-height: 320px;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	z-index: 9999;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const DropdownSearch = styled.input`
	width: 100%;
	border: none;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.text};
	padding: 10px 14px;
	font-size: 14px;
	outline: none;
	&::placeholder {
		color: ${({ theme }) => theme.colors.textMuted};
	}
`;

const DropdownList = styled.div`
	overflow-y: auto;
	flex: 1;
	padding: 4px;
`;

const CatLabel = styled.div`
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: ${({ theme }) => theme.colors.textMuted};
	padding: 8px 10px 4px;
	display: flex;
	align-items: center;
	gap: 5px;
`;

const DropdownItem = styled.div<{ $selected?: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 7px 10px;
	cursor: pointer;
	font-size: 13px;
	border-radius: 8px;
	color: ${({ theme }) => theme.colors.text};
	background: ${({ $selected, theme }) => ($selected ? theme.colors.accentGlow : 'transparent')};
	&:hover {
		background: ${({ theme }) => theme.colors.bgSecondary};
	}
`;

const DropdownItemFlag = styled.span`
	font-size: 16px;
	line-height: 1;
	flex-shrink: 0;
`;

const DropdownItemCode = styled.span`
	font-weight: 700;
	flex-shrink: 0;
	min-width: 30px;
`;

const DropdownItemName = styled.span`
	color: ${({ theme }) => theme.colors.textMuted};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 11px;
`;

/* ── View toggle ──────────────────────────────── */

const ViewToggle = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	background: ${({ theme }) => theme.colors.bgSecondary};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	padding: 3px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	align-self: center;
`;

const ViewBtn = styled.button<{ $active: boolean }>`
	padding: 6px 14px;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.full};
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.15s;
	background: ${({ $active, theme }) => ($active ? theme.colors.accent : 'transparent')};
	color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.textMuted)};
	display: flex;
	align-items: center;
	gap: 5px;
	&:hover {
		color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.text)};
	}
	svg {
		width: 14px;
		height: 14px;
	}
`;

/* ── Component ──────────────────────────────── */

const CalculatorView = () => {
	const { t } = useTranslation();
	const { settings } = useAppSettings();
	const [amount, setAmount] = useState('1');
	const [fromCurrency, setFromCurrency] = useState(settings.baseCurrency);
	const [toCurrency, setToCurrency] = useState(() => {
		const first = settings.selectedCurrencies.find((c) => c !== settings.baseCurrency);
		return first || 'EUR';
	});
	const [selectedDate, setSelectedDate] = useState<string>(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	});
	const [openDropdown, setOpenDropdown] = useState<'from' | 'to' | null>(null);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [chartView, setChartView] = useState<'chart' | 'table'>('chart');

	const fromDropdownRef = useRef<HTMLDivElement>(null);
	const toDropdownRef = useRef<HTMLDivElement>(null);
	const dropdownFloatRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const hiddenDateRef = useRef<HTMLInputElement>(null);

	const todayStr = useMemo(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}, []);

	const { data: apiCurrencies } = useCurrenciesQuery();

	const allAvailableCurrencies = useMemo(() => {
		const all = new Set([settings.baseCurrency, ...settings.selectedCurrencies, ...(apiCurrencies || [])]);
		return Array.from(all);
	}, [settings.baseCurrency, settings.selectedCurrencies, apiCurrencies]);

	// Rate from centralized store
	const { rate, isFetching: calcFetching } = useRate(fromCurrency, toCurrency, selectedDate);

	const reverseRate = rate != null && rate !== 0 ? 1 / rate : null;
	const result = useMemo(() => {
		const num = parseFloat(amount);
		if (Number.isNaN(num) || rate == null) return null;
		return num * rate;
	}, [amount, rate]);

	// History for chart/table — last 3 months for the pair
	const historyFrom = useMemo(() => format(subMonths(new Date(), 3), 'yyyy-MM-dd'), []);
	const pairCurrencies = useMemo(() => {
		const set = new Set([fromCurrency, toCurrency]);
		set.delete('USD');
		return Array.from(set);
	}, [fromCurrency, toCurrency]);

	const {
		data: historyData,
		isLoading: historyLoading,
		isError: historyError
	} = useRangeRates(historyFrom, todayStr, pairCurrencies, fromCurrency !== toCurrency);

	// Convert history to show toCurrency relative to fromCurrency
	const convertedHistory: HistoryResponse | undefined = useMemo(() => {
		if (!historyData?.data?.length) return undefined;
		if (fromCurrency === toCurrency) return undefined;
		return {
			base: fromCurrency,
			data: historyData.data
				.map((entry) => {
					const fromRate = fromCurrency === 'USD' ? 1 : (entry.rates[fromCurrency] ?? 0);
					const toRate = toCurrency === 'USD' ? 1 : (entry.rates[toCurrency] ?? 0);
					const converted = fromRate !== 0 ? toRate / fromRate : 0;
					return { date: entry.date, rates: { [toCurrency]: converted } };
				})
				.filter((e) => e.rates[toCurrency] !== 0)
		};
	}, [historyData, fromCurrency, toCurrency]);

	// Dropdown logic
	useEffect(() => {
		if (!openDropdown) return;
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			const ref = openDropdown === 'from' ? fromDropdownRef : toDropdownRef;
			if (ref.current?.contains(target)) return;
			if (dropdownFloatRef.current?.contains(target)) return;
			setOpenDropdown(null);
			setSearchQuery('');
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [openDropdown]);

	useEffect(() => {
		if (openDropdown) setTimeout(() => searchInputRef.current?.focus(), 0);
	}, [openDropdown]);

	const lang = settings.language;
	const catLabelMap: Record<string, Record<CurrencyCategory, string>> = {
		ru: CATEGORY_LABELS_RU,
		ja: CATEGORY_LABELS_JA,
		es: CATEGORY_LABELS_ES
	};
	const catLabels = catLabelMap[lang] || CATEGORY_LABELS_EN;

	const groupByCat = useCallback(
		(list: string[]) => {
			const groups: { cat: CurrencyCategory; label: string; icon: string; items: string[] }[] = [];
			for (const cat of ALL_CATEGORIES) {
				const items = list.filter((c) => getCurrencyCategory(c) === cat);
				if (items.length > 0) groups.push({ cat, label: catLabels[cat], icon: CATEGORY_ICONS[cat], items });
			}
			return groups;
		},
		[catLabels]
	);

	const dropdownGroups = useMemo(() => {
		const filtered = allAvailableCurrencies.filter((c) => matchesCurrencySearch(c, searchQuery, lang));
		return groupByCat(filtered);
	}, [allAvailableCurrencies, searchQuery, lang, groupByCat]);

	const handleSelectCurrency = (which: 'from' | 'to', code: string) => {
		if (which === 'from') setFromCurrency(code);
		else setToCurrency(code);
		setOpenDropdown(null);
		setSearchQuery('');
	};

	const toggleDropdown = (which: 'from' | 'to') => {
		if (openDropdown === which) {
			setOpenDropdown(null);
			setSearchQuery('');
		} else {
			const ref = which === 'from' ? fromDropdownRef : toDropdownRef;
			if (ref.current) {
				const rect = ref.current.getBoundingClientRect();
				setDropdownPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 - 140 });
			}
			setOpenDropdown(which);
			setSearchQuery('');
		}
	};

	const swap = () => {
		setFromCurrency(toCurrency);
		setToCurrency(fromCurrency);
	};
	const currentValue = openDropdown === 'from' ? fromCurrency : toCurrency;

	const fmt = (val: number): string => {
		if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		if (val >= 1) return val.toFixed(3);
		return val.toFixed(4);
	};

	const fmtShort = (val: number): string => {
		if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		if (val >= 1) return val.toFixed(2);
		return val.toFixed(3);
	};

	const fromSymbol = CURRENCY_SYMBOLS[fromCurrency] || '';
	const toSymbol = CURRENCY_SYMBOLS[toCurrency] || '';

	const formatSelectedDate = (dateStr: string): string => {
		if (!dateStr) return '';
		try {
			const d = new Date(`${dateStr}T00:00:00`);
			return d.toLocaleDateString(
				lang === 'ru' ? 'ru-RU' : lang === 'ja' ? 'ja-JP' : lang === 'es' ? 'es-ES' : 'en-US',
				{
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				}
			);
		} catch {
			return dateStr;
		}
	};

	const handleDateClick = () => {
		hiddenDateRef.current?.showPicker?.();
	};

	const renderFixedDropdown = () => {
		if (!openDropdown || !dropdownPos) return null;
		return (
			<DropdownWrapper ref={dropdownFloatRef} style={{ top: dropdownPos.top, left: dropdownPos.left }}>
				<DropdownSearch
					ref={searchInputRef}
					type="text"
					placeholder={t('calc.searchCurrency', 'Search currency...')}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onClick={(e) => e.stopPropagation()}
				/>
				<DropdownList>
					{dropdownGroups.map((group) => (
						<React.Fragment key={group.cat}>
							<CatLabel>
								{group.icon} {group.label}
							</CatLabel>
							{group.items.map((c) => (
								<DropdownItem
									key={c}
									$selected={c === currentValue}
									onClick={(e) => {
										e.stopPropagation();
										handleSelectCurrency(openDropdown, c);
									}}
								>
									<DropdownItemFlag>{CURRENCY_FLAGS[c] || ''}</DropdownItemFlag>
									<DropdownItemCode>{c}</DropdownItemCode>
									<DropdownItemName>{getCurrencyName(c, lang)}</DropdownItemName>
								</DropdownItem>
							))}
						</React.Fragment>
					))}
				</DropdownList>
			</DropdownWrapper>
		);
	};

	return (
		<>
			<Container initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
				<CalcCard>
					<Header>
						<HeaderRow>
							<CurrPill ref={fromDropdownRef} onClick={() => toggleDropdown('from')}>
								<CurrFlag>{CURRENCY_FLAGS[fromCurrency]}</CurrFlag>
								<CurrCode>{fromCurrency}</CurrCode>
								<CurrChevron>▼</CurrChevron>
							</CurrPill>
							<SwapIcon
								onClick={(e) => {
									e.stopPropagation();
									swap();
								}}
								whileTap={{ scale: 0.85 }}
							>
								⇄
							</SwapIcon>
							<CurrPill ref={toDropdownRef} onClick={() => toggleDropdown('to')}>
								<CurrFlag>{CURRENCY_FLAGS[toCurrency]}</CurrFlag>
								<CurrCode>{toCurrency}</CurrCode>
								<CurrChevron>▼</CurrChevron>
							</CurrPill>
						</HeaderRow>
					</Header>

					<DateRow>
						<DateButton onClick={handleDateClick}>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
								<line x1="16" y1="2" x2="16" y2="6" />
								<line x1="8" y1="2" x2="8" y2="6" />
								<line x1="3" y1="10" x2="21" y2="10" />
							</svg>
							{formatSelectedDate(selectedDate)}
							<NativeDateInput
								ref={hiddenDateRef}
								type="date"
								value={selectedDate}
								max={todayStr}
								onChange={(e) => setSelectedDate(e.target.value)}
							/>
						</DateButton>
					</DateRow>

					<AmountBlock $active>
						<AmountRow>
							{fromSymbol && <AmountSymbol>{fromSymbol}</AmountSymbol>}
							<AmountInput
								type="number"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0"
								min="0"
								step="any"
								autoFocus
							/>
						</AmountRow>
						{calcFetching ? (
							<RateHint>{t('calc.loading', 'Loading rate...')}</RateHint>
						) : rate != null ? (
							<RateHint>
								1 {fromCurrency} = {fmtShort(rate)} {toCurrency}
							</RateHint>
						) : null}
					</AmountBlock>

					<AmountBlock>
						<AmountRow>
							{toSymbol && <AmountSymbol>{toSymbol}</AmountSymbol>}
							{calcFetching ? (
								<AmountDisplay>
									<LoadingDots>
										<span />
										<span />
										<span />
									</LoadingDots>
								</AmountDisplay>
							) : (
								<AmountDisplay>{result != null ? fmt(result) : '—'}</AmountDisplay>
							)}
						</AmountRow>
						{!calcFetching && reverseRate != null && (
							<RateHint>
								1 {toCurrency} = {fmtShort(reverseRate)} {fromCurrency}
							</RateHint>
						)}
					</AmountBlock>
				</CalcCard>

				{fromCurrency !== toCurrency && (
					<>
						<ViewToggle>
							<ViewBtn $active={chartView === 'chart'} onClick={() => setChartView('chart')}>
								<svg
									aria-hidden="true"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
									<polyline points="17 6 23 6 23 12" />
								</svg>
								{t('chartTable.chart', 'Chart')}
							</ViewBtn>
							<ViewBtn $active={chartView === 'table'} onClick={() => setChartView('table')}>
								<svg
									aria-hidden="true"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
									<line x1="3" y1="9" x2="21" y2="9" />
									<line x1="3" y1="15" x2="21" y2="15" />
									<line x1="9" y1="3" x2="9" y2="21" />
								</svg>
								{t('chartTable.table', 'Table')}
							</ViewBtn>
						</ViewToggle>

						{chartView === 'chart' ? (
							<CurrencyChart
								data={convertedHistory}
								isLoading={historyLoading}
								isError={historyError}
								currencies={[toCurrency]}
							/>
						) : (
							<RatesTable data={convertedHistory} currencies={[toCurrency]} />
						)}
					</>
				)}
			</Container>
			{renderFixedDropdown()}
		</>
	);
};

export default CalculatorView;
