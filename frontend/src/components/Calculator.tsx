'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { HistoryResponse } from '@/lib/api';
import { CURRENCY_FLAGS, CURRENCY_SYMBOLS, getCurrencyName, matchesCurrencySearch, getCurrencyCategory, ALL_CATEGORIES, CATEGORY_LABELS_EN, CATEGORY_LABELS_RU, CATEGORY_LABELS_JA, CATEGORY_LABELS_ES, CATEGORY_ICONS, type CurrencyCategory } from '@/lib/currencies';
import { useAppSettings } from '@/providers/Providers';
import { useCurrenciesQuery } from '@/hooks/useRates';
import { useRate } from '@/hooks/useRateStore';

/* ── Panel ───────────────────────────────────── */

const Overlay = styled(motion.div)`
	position: fixed;
	inset: 0;
	z-index: 999;

	@media (min-width: 769px) {
		display: none;
	}
`;

const Panel = styled(motion.div)`
	position: fixed;
	width: 420px;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	overflow: visible;
	z-index: 1001;

	@media (max-width: 768px) {
		width: auto;
		left: 16px !important;
		right: 16px !important;
	}
`;

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

	@media (max-width: 768px) { font-size: 20px; }
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
	-moz-appearance: textfield;

	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	&::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
	@media (max-width: 768px) { font-size: 32px; }
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

	@media (max-width: 768px) { font-size: 32px; }
`;

const RateHint = styled.div`
	font-size: 13px;
	color: ${({ theme }) => theme.colors.textMuted};
	margin-top: 8px;
	font-weight: 500;
`;

const CalcBrand = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px 12px 6px;
	cursor: grab;
	user-select: none;
	position: relative;

	&:active { cursor: grabbing; }
`;

const BrandTitle = styled.div`
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: ${({ theme }) => theme.colors.textMuted};
	margin-top: 4px;
`;

const CloseBtn = styled.button`
	position: absolute;
	top: 8px;
	right: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	border: none;
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.textMuted};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	cursor: pointer;
	font-size: 13px;
	transition: all 0.15s;
	z-index: 1;

	&:hover {
		background: ${({ theme }) => theme.colors.danger};
		color: white;
	}
`;

/* ── Date picker — single clickable label ───── */

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

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}

	svg { width: 14px; height: 14px; }
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
	font-size: 16px; /* prevents iOS zoom on focus */
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
		animation: calcPulse 1.2s ease-in-out infinite;
	}

	span:nth-child(2) { animation-delay: 0.2s; }
	span:nth-child(3) { animation-delay: 0.4s; }

	@keyframes calcPulse {
		0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
		40% { opacity: 1; transform: scale(1.1); }
	}
`;

/* ── Currency dropdown ───────────────────────── */

const DropdownWrapper = styled.div`
	position: absolute;
	top: calc(100% + 6px);
	left: 50%;
	transform: translateX(-50%);
	width: 280px;
	max-height: 320px;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	z-index: 1010;
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
	background: ${({ $selected, theme }) => $selected ? theme.colors.accentGlow : 'transparent'};

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

/* ── Component ───────────────────────────── */

const PANEL_W = 420;

function clampPos(xPct: number, yPct: number): { x: number; y: number } {
	const vw = window.innerWidth || 1;
	const vh = window.innerHeight || 1;
	const xPx = (xPct / 100) * vw;
	const yPx = (yPct / 100) * vh;
	const clampedX = Math.max(0, Math.min(xPx, vw - PANEL_W));
	const clampedY = Math.max(0, Math.min(yPx, vh - 100));
	return { x: (clampedX / vw) * 100, y: (clampedY / vh) * 100 };
}

interface CalculatorProps {
	data?: HistoryResponse;
	baseCurrency: string;
	currencies: string[];
	open: boolean;
	onClose: () => void;
	catPos?: { xPct: number; yPct: number } | null;
}

const Calculator = ({ data, baseCurrency, currencies, open, onClose, catPos }: CalculatorProps) => {
	const { t } = useTranslation();
	const { settings } = useAppSettings();
	const [amount, setAmount] = useState('1');
	const [fromCurrency, setFromCurrency] = useState(baseCurrency);
	const [toCurrency, setToCurrency] = useState(currencies[0] || 'EUR');
	const [selectedDate, setSelectedDate] = useState<string>(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	});
	const [openDropdown, setOpenDropdown] = useState<'from' | 'to' | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	// Whether user has manually dragged the calc (decouples from cat)
	const [manualDrag, setManualDrag] = useState(false);
	// Position stored as % of viewport, persisted to localStorage
	const [posPercent, setPosPercent] = useState<{ x: number; y: number } | null>(() => {
		if (typeof window === 'undefined') return null;
		try {
			const saved = localStorage.getItem('sharkie-calc-pos');
			if (saved) return JSON.parse(saved);
		} catch { /* ignore */ }
		return null;
	});
	const [dragging, setDragging] = useState(false);
	const dragOffset = useRef({ x: 0, y: 0 });
	const panelRef = useRef<HTMLDivElement>(null);

	const fromDropdownRef = useRef<HTMLDivElement>(null);
	const toDropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const hiddenDateRef = useRef<HTMLInputElement>(null);

	// Reset manual drag when opening
	useEffect(() => {
		if (open) setManualDrag(false);
	}, [open]);

	// Save position to localStorage
	useEffect(() => {
		if (posPercent) {
			try { localStorage.setItem('sharkie-calc-pos', JSON.stringify(posPercent)); } catch { /* ignore */ }
		}
	}, [posPercent]);

	// Follow cat position when not manually dragged
	useEffect(() => {
		if (!open || manualDrag || dragging) return;
		if (catPos) {
			// Position calc above the cat (offset up by ~45vh-pixels worth)
			const vh = window.innerHeight || 1;
			const aboveOffset = (420 / vh) * 100; // panel height ~ 420px
			const clamped = clampPos(catPos.xPct - 20, catPos.yPct - aboveOffset - 5);
			setPosPercent(clamped);
		}
	}, [catPos, open, manualDrag, dragging]);

	// Drag handlers
	const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		const panel = panelRef.current;
		if (!panel) return;
		const rect = panel.getBoundingClientRect();
		dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
		setDragging(true);
		setManualDrag(true);
	}, []);

	useEffect(() => {
		if (!dragging) return;
		const handleMove = (e: MouseEvent | TouchEvent) => {
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
			const newX = clientX - dragOffset.current.x;
			const newY = clientY - dragOffset.current.y;
			const vw = window.innerWidth || 1;
			const vh = window.innerHeight || 1;
			const clamped = clampPos((newX / vw) * 100, (newY / vh) * 100);
			setPosPercent(clamped);
		};
		const handleUp = () => setDragging(false);
		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', handleUp);
		window.addEventListener('touchmove', handleMove, { passive: false });
		window.addEventListener('touchend', handleUp);
		return () => {
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleUp);
			window.removeEventListener('touchmove', handleMove);
			window.removeEventListener('touchend', handleUp);
		};
	}, [dragging]);

	useEffect(() => { setFromCurrency(baseCurrency); }, [baseCurrency]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const calcParam = params.get('calc');
		if (calcParam) {
			const parts = calcParam.split('-');
			if (parts.length >= 2) {
				setFromCurrency(parts[0]);
				setToCurrency(parts[1]);
				if (parts[2]) setAmount(parts[2]);
			}
		}
	}, []);

	useEffect(() => {
		if (!openDropdown) return;
		const handleClickOutside = (e: MouseEvent) => {
			const ref = openDropdown === 'from' ? fromDropdownRef : toDropdownRef;
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpenDropdown(null);
				setSearchQuery('');
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [openDropdown]);

	useEffect(() => {
		if (openDropdown) setTimeout(() => searchInputRef.current?.focus(), 0);
	}, [openDropdown]);

	const { data: apiCurrencies } = useCurrenciesQuery();

	const allAvailableCurrencies = useMemo(() => {
		const fromRates = data?.data?.length
			? Object.keys(data.data[data.data.length - 1].rates)
			: [];
		const all = new Set([baseCurrency, ...currencies, ...fromRates, ...(apiCurrencies || [])]);
		return Array.from(all);
	}, [data, baseCurrency, currencies, apiCurrencies]);

	const todayStr = useMemo(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}, []);

	// Use centralized rate store
	const { rate, isFetching: calcFetching } = useRate(fromCurrency, toCurrency, selectedDate, open);

	const reverseRate = rate != null && rate !== 0 ? 1 / rate : null;

	const result = useMemo(() => {
		const num = parseFloat(amount);
		if (isNaN(num) || rate == null) return null;
		return num * rate;
	}, [amount, rate]);

	const swap = () => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); };

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

	const lang = settings.language;
	const catLabelMap: Record<string, Record<CurrencyCategory, string>> = {
		ru: CATEGORY_LABELS_RU, ja: CATEGORY_LABELS_JA, es: CATEGORY_LABELS_ES
	};
	const catLabels = catLabelMap[lang] || CATEGORY_LABELS_EN;

	const groupByCat = useCallback((list: string[]) => {
		const groups: { cat: CurrencyCategory; label: string; icon: string; items: string[] }[] = [];
		for (const cat of ALL_CATEGORIES) {
			const items = list.filter((c) => getCurrencyCategory(c) === cat);
			if (items.length > 0) {
				groups.push({ cat, label: catLabels[cat], icon: CATEGORY_ICONS[cat], items });
			}
		}
		return groups;
	}, [catLabels]);

	const dropdownGroups = useMemo(() => {
		const filtered = allAvailableCurrencies.filter((c) =>
			matchesCurrencySearch(c, searchQuery, lang)
		);
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
			setOpenDropdown(which);
			setSearchQuery('');
		}
	};

	const currentValue = openDropdown === 'from' ? fromCurrency : toCurrency;

	const formatSelectedDate = (dateStr: string): string => {
		if (!dateStr) return '';
		try {
			const d = new Date(dateStr + 'T00:00:00');
			return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		} catch {
			return dateStr;
		}
	};

	const handleDateClick = () => {
		hiddenDateRef.current?.showPicker?.();
	};

	const renderDropdown = (which: 'from' | 'to') => {
		if (openDropdown !== which) return null;

		return (
			<DropdownWrapper>
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
							<CatLabel>{group.icon} {group.label}</CatLabel>
							{group.items.map((c) => (
								<DropdownItem
									key={c}
									$selected={c === currentValue}
									onClick={(e) => { e.stopPropagation(); handleSelectCurrency(which, c); }}
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
		<AnimatePresence>
			{open && (
				<>
					<Overlay
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					/>
					<Panel
						ref={panelRef}
						initial={{ opacity: 0, y: 30, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 30, scale: 0.95 }}
						transition={{ type: 'spring', damping: 25, stiffness: 350 }}
						style={posPercent
							? { left: `${posPercent.x}vw`, top: `${posPercent.y}vh`, right: 'auto', bottom: 'auto' }
							: { bottom: 92, right: 24 }
						}
					>
						<CalcBrand
							onMouseDown={handleDragStart}
							onTouchStart={handleDragStart}
						>
							<CloseBtn onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</CloseBtn>
							<BrandTitle>{t('calc.title')}</BrandTitle>
						</CalcBrand>

						<Header>
							<HeaderRow>
								<CurrPill
									ref={fromDropdownRef}
									onClick={() => toggleDropdown('from')}
								>
									<CurrFlag>{CURRENCY_FLAGS[fromCurrency]}</CurrFlag>
									<CurrCode>{fromCurrency}</CurrCode>
									<CurrChevron>▼</CurrChevron>
									{renderDropdown('from')}
								</CurrPill>

								<SwapIcon onClick={(e) => { e.stopPropagation(); swap(); }} whileTap={{ scale: 0.85 }}>⇄</SwapIcon>

								<CurrPill
									ref={toDropdownRef}
									onClick={() => toggleDropdown('to')}
								>
									<CurrFlag>{CURRENCY_FLAGS[toCurrency]}</CurrFlag>
									<CurrCode>{toCurrency}</CurrCode>
									<CurrChevron>▼</CurrChevron>
									{renderDropdown('to')}
								</CurrPill>
							</HeaderRow>
						</Header>

						<DateRow>
								<DateButton style={{ position: 'relative' }} onClick={handleDateClick}>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
								<RateHint>1 {fromCurrency} = {fmtShort(rate)} {toCurrency}</RateHint>
							) : null}
						</AmountBlock>

						<AmountBlock>
							<AmountRow>
								{toSymbol && <AmountSymbol>{toSymbol}</AmountSymbol>}
								{calcFetching ? (
									<AmountDisplay><LoadingDots><span /><span /><span /></LoadingDots></AmountDisplay>
								) : (
									<AmountDisplay>{result != null ? fmt(result) : '—'}</AmountDisplay>
								)}
							</AmountRow>
							{!calcFetching && reverseRate != null && (
								<RateHint>1 {toCurrency} = {fmtShort(reverseRate)} {fromCurrency}</RateHint>
							)}
						</AmountBlock>
					</Panel>
				</>
			)}
		</AnimatePresence>
	);
};

export default Calculator;
