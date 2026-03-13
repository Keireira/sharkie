'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '@/providers/Providers';
import {
	CURRENCY_FLAGS,
	CURRENCY_SYMBOLS,
	getCurrencyName,
	matchesCurrencySearch,
	getCurrencyCategory,
	ALL_CATEGORIES,
	CATEGORY_LABELS_EN,
	CATEGORY_LABELS_RU,
	CATEGORY_LABELS_JA,
	CATEGORY_LABELS_ES,
	CATEGORY_ICONS,
	type CurrencyCategory,
	formatRate as fmtRate
} from '@/lib/currencies';
import { useTodayAllRatesQuery } from '@/hooks/useRates';

/* ── Styled ───────────────────────────────────── */

const Section = styled.div`
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

const CountBadge = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.textMuted};
	background: ${({ theme }) => theme.colors.bgSecondary};
	padding: 2px 10px;
	border-radius: ${({ theme }) => theme.borderRadius.full};
`;

/* ── Toolbar ──────────────────────────────────── */

const Toolbar = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	flex-wrap: wrap;
`;

const ToolBtn = styled.button<{ $active?: boolean }>`
	height: 36px;
	padding: 0 14px;
	display: flex;
	align-items: center;
	gap: 6px;
	border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.border)};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : theme.colors.card)};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textSecondary)};
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s;
	position: relative;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}

	svg {
		flex-shrink: 0;
	}
`;

const ActiveDot = styled.span`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${({ theme }) => theme.colors.accent};
`;

const SearchWrap = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	margin-left: auto;
`;

const SearchIcon = styled.div`
	position: absolute;
	left: 10px;
	color: ${({ theme }) => theme.colors.textMuted};
	pointer-events: none;
	display: flex;
	align-items: center;
`;

const SearchInput = styled.input`
	height: 36px;
	padding: 0 12px 0 34px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: ${({ theme }) => theme.colors.card};
	color: ${({ theme }) => theme.colors.text};
	font-size: 13px;
	outline: none;
	width: 220px;
	transition: border-color 0.2s, box-shadow 0.2s;

	&::placeholder {
		color: ${({ theme }) => theme.colors.textMuted};
	}

	&:focus {
		border-color: ${({ theme }) => theme.colors.accent};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.accentGlow};
	}

	@media (max-width: 640px) {
		width: 140px;
	}
`;

/* ── Dropdown / Popover ───────────────────────── */

const DropdownWrap = styled.div`
	position: relative;
`;

const Popover = styled(motion.div)`
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	z-index: 100;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	padding: ${({ theme }) => theme.spacing.md};
	min-width: 260px;
`;

const PopoverTitle = styled.div`
	font-size: 14px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FilterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const FilterTile = styled.button<{ $active: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 14px 8px;
	border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.border)};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : theme.colors.bgSecondary)};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textSecondary)};
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		background: ${({ theme }) => theme.colors.accentGlow};
		color: ${({ theme }) => theme.colors.accent};
	}
`;

const TileIcon = styled.div`
	font-size: 22px;
	line-height: 1;
`;

const TileLabel = styled.span`
	font-size: 12px;
	font-weight: 600;
`;

const TileCount = styled.span`
	font-size: 10px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.textMuted};
`;

/* ── Sort popover ─────────────────────────────── */

const SortList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const SortItem = styled.button<{ $active: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : 'transparent')};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textSecondary)};
	font-size: 13px;
	font-weight: ${({ $active }) => ($active ? 600 : 500)};
	cursor: pointer;
	text-align: left;
	transition: all 0.1s;

	&:hover {
		background: ${({ theme }) => theme.colors.bgSecondary};
		color: ${({ theme }) => theme.colors.text};
	}
`;

const SortCheck = styled.span`
	width: 16px;
	font-size: 12px;
	color: ${({ theme }) => theme.colors.accent};
`;

/* ── Category tabs ────────────────────────────── */

const TabsRow = styled.div`
	display: flex;
	gap: 4px;
	overflow-x: auto;
	scrollbar-width: none;
	-ms-overflow-style: none;
	&::-webkit-scrollbar { display: none; }
	padding-bottom: 2px;
`;

const Tab = styled.button<{ $active: boolean }>`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.border)};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : theme.colors.card)};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textSecondary)};
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.15s;
	flex-shrink: 0;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}
`;

const TabCount = styled.span`
	font-size: 11px;
	font-weight: 700;
	opacity: 0.6;
`;

/* ── Stats ────────────────────────────────────── */

const StatsBar = styled.div`
	display: flex;
	gap: ${({ theme }) => theme.spacing.sm};
	flex-wrap: wrap;
`;

const StatBadge = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.xs};
	padding: 6px 14px;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	font-size: 13px;
	color: ${({ theme }) => theme.colors.textSecondary};
`;

const StatNumber = styled.span<{ $color: string }>`
	font-size: 18px;
	font-weight: 800;
	color: ${({ $color }) => $color};
	font-variant-numeric: tabular-nums;
`;

const StatLabel = styled.span`
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: ${({ theme }) => theme.colors.textMuted};
`;

/* ── Cards ────────────────────────────────────── */

const CardsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
	gap: ${({ theme }) => theme.spacing.md};

	@media (max-width: 640px) {
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: ${({ theme }) => theme.spacing.sm};
	}
`;

const CurrCard = styled.div<{ $selected: boolean }>`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ $selected, theme }) => ($selected ? theme.colors.accent : theme.colors.border)};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	padding: ${({ theme }) => theme.spacing.md};
	box-shadow: ${({ theme }) => theme.colors.shadowSm};
	cursor: pointer;
	transition: all 0.2s;
	position: relative;
	overflow: hidden;

	&:hover {
		border-color: ${({ theme }) => theme.colors.borderHover};
		box-shadow: ${({ theme }) => theme.colors.shadow};
		transform: translateY(-2px);
	}

	@media (max-width: 640px) {
		padding: ${({ theme }) => theme.spacing.sm};
	}
`;

const CardHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FlagWrap = styled.div`
	font-size: 32px;
	line-height: 1;

	@media (max-width: 640px) {
		font-size: 24px;
	}
`;

const CardActions = styled.div`
	display: flex;
	gap: 4px;
`;

const IconBtn = styled.button<{ $active?: boolean }>`
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.warning : theme.colors.border)};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: ${({ $active }) => ($active ? 'rgba(255, 182, 48, 0.12)' : 'transparent')};
	color: ${({ $active, theme }) => ($active ? theme.colors.warning : theme.colors.textMuted)};
	font-size: 14px;
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		border-color: ${({ theme }) => theme.colors.warning};
		color: ${({ theme }) => theme.colors.warning};
	}
`;

const SelectedBadge = styled.div`
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid ${({ theme }) => theme.colors.accent};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: ${({ theme }) => theme.colors.accentGlow};
	color: ${({ theme }) => theme.colors.accent};
	font-size: 14px;
`;

const CurrName = styled.div`
	font-size: 14px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	margin-bottom: 2px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	@media (max-width: 640px) {
		font-size: 12px;
	}
`;

const MetaRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const MetaLabel = styled.span`
	font-size: 11px;
	color: ${({ theme }) => theme.colors.textMuted};
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const MetaValue = styled.span`
	font-size: 13px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.textSecondary};
	font-variant-numeric: tabular-nums;
`;

const CardDivider = styled.div`
	height: 1px;
	background: ${({ theme }) => theme.colors.border};
	margin: ${({ theme }) => theme.spacing.sm} 0;
`;

const RateRow = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
`;

const RateLabel = styled.span`
	font-size: 11px;
	color: ${({ theme }) => theme.colors.textMuted};
	text-transform: uppercase;
	letter-spacing: 0.04em;
`;

const RateValue = styled.span<{ $hasRate: boolean }>`
	font-size: 18px;
	font-weight: 800;
	color: ${({ $hasRate, theme }) => ($hasRate ? theme.colors.accent : theme.colors.textMuted)};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;

	@media (max-width: 640px) {
		font-size: 15px;
	}
`;

const NoResults = styled.div`
	text-align: center;
	padding: ${({ theme }) => theme.spacing.xxl};
	color: ${({ theme }) => theme.colors.textMuted};
	font-size: 14px;
`;

/* ── Helpers ──────────────────────────────────── */

// formatRate imported as fmtRate from @/lib/currencies

type Filter = 'all' | 'selected' | 'favorites';
type SortMode = 'alpha' | 'rate-asc' | 'rate-desc' | 'name';

/* ── useClickOutside hook ─────────────────────── */

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
	useEffect(() => {
		const listener = (e: MouseEvent | TouchEvent) => {
			if (!ref.current || ref.current.contains(e.target as Node)) return;
			handler();
		};
		document.addEventListener('mousedown', listener);
		document.addEventListener('touchstart', listener);
		return () => {
			document.removeEventListener('mousedown', listener);
			document.removeEventListener('touchstart', listener);
		};
	}, [ref, handler]);
}

/* ── SVG Icons ────────────────────────────────── */

const FilterIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
	</svg>
);

const SortIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<line x1="4" y1="6" x2="16" y2="6" /><line x1="4" y1="12" x2="12" y2="12" /><line x1="4" y1="18" x2="8" y2="18" />
	</svg>
);

const SearchSvg = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
	</svg>
);

/* ── Component ───────────────────────────────── */

const CurrencyLibrary = () => {
	const { t, i18n } = useTranslation();
	const { settings, setSettings } = useAppSettings();
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<Filter>('all');
	const [sort, setSort] = useState<SortMode>('alpha');
	const [category, setCategory] = useState<CurrencyCategory | 'all'>('major');
	const [filterOpen, setFilterOpen] = useState(false);
	const [sortOpen, setSortOpen] = useState(false);

	const filterRef = useRef<HTMLDivElement>(null);
	const sortRef = useRef<HTMLDivElement>(null);

	useClickOutside(filterRef, useCallback(() => setFilterOpen(false), []));
	useClickOutside(sortRef, useCallback(() => setSortOpen(false), []));

	const { data } = useTodayAllRatesQuery(settings.baseCurrency);

	const latestRates = useMemo(() => {
		if (!data?.data?.length) return null;
		return data.data[data.data.length - 1].rates;
	}, [data]);

	const allCurrencies = useMemo(() => {
		if (!latestRates) return [];
		return Object.keys(latestRates).sort();
	}, [latestRates]);

	// Count per category (for tab badges)
	const categoryCounts = useMemo(() => {
		const counts: Record<string, number> = { all: allCurrencies.length };
		for (const cat of ALL_CATEGORIES) counts[cat] = 0;
		for (const code of allCurrencies) {
			const cat = getCurrencyCategory(code);
			counts[cat] = (counts[cat] || 0) + 1;
		}
		return counts;
	}, [allCurrencies]);

	const currencies = useMemo(() => {
		let list = allCurrencies;

		// Category filter
		if (category !== 'all') {
			list = list.filter((c) => getCurrencyCategory(c) === category);
		}

		if (filter === 'selected') {
			list = list.filter((c) => settings.selectedCurrencies.includes(c));
		} else if (filter === 'favorites') {
			list = list.filter((c) => settings.favoriteCurrencies.includes(c));
		}

		if (search.trim()) {
			list = list.filter((c) => matchesCurrencySearch(c, search, i18n.language));
		}

		// Sort
		const rates = latestRates || {};
		switch (sort) {
			case 'alpha':
				list = [...list].sort();
				break;
			case 'name':
				list = [...list].sort((a, b) =>
					getCurrencyName(a, i18n.language).localeCompare(getCurrencyName(b, i18n.language))
				);
				break;
			case 'rate-asc':
				list = [...list].sort((a, b) => (rates[a] ?? 0) - (rates[b] ?? 0));
				break;
			case 'rate-desc':
				list = [...list].sort((a, b) => (rates[b] ?? 0) - (rates[a] ?? 0));
				break;
		}

		return list;
	}, [filter, search, sort, category, allCurrencies, latestRates, settings.selectedCurrencies, settings.favoriteCurrencies, i18n.language]);

	const stats = useMemo(() => ({
		total: allCurrencies.length,
		selected: settings.selectedCurrencies.length,
		favorites: settings.favoriteCurrencies.length
	}), [allCurrencies, settings.selectedCurrencies, settings.favoriteCurrencies]);

	const toggleSelected = (code: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const curr = settings.selectedCurrencies;
		if (curr.includes(code)) {
			if (curr.length <= 1) return;
			setSettings({ selectedCurrencies: curr.filter((c) => c !== code) });
		} else {
			setSettings({ selectedCurrencies: [...curr, code] });
		}
	};

	const toggleFavorite = (code: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const favs = settings.favoriteCurrencies;
		if (favs.includes(code)) {
			setSettings({ favoriteCurrencies: favs.filter((c) => c !== code) });
		} else {
			setSettings({ favoriteCurrencies: [...favs, code] });
		}
	};

	const filterLabel = filter === 'all'
		? t('library.filterAll')
		: filter === 'selected'
			? t('library.filterActive')
			: t('library.filterFavorites');

	const sortLabels: Record<SortMode, string> = {
		alpha: 'A → Z',
		name: i18n.language === 'ru' ? 'По имени' : 'By name',
		'rate-asc': i18n.language === 'ru' ? 'Курс ↑' : 'Rate ↑',
		'rate-desc': i18n.language === 'ru' ? 'Курс ↓' : 'Rate ↓'
	};

	return (
		<Section>
			<TitleRow>
				<TitleLeft>
					<TitleBar />
					<Title>{t('library.title')}</Title>
					<CountBadge>{currencies.length}</CountBadge>
				</TitleLeft>
			</TitleRow>

			{/* Stats */}
			<StatsBar>
				<StatBadge>
					<StatNumber $color={settings.theme === 'dark' ? '#60a5fa' : '#3b82f6'}>{stats.total}</StatNumber>
					<StatLabel>{t('library.total')}</StatLabel>
				</StatBadge>
				<StatBadge>
					<StatNumber $color={settings.theme === 'dark' ? '#2ee8a5' : '#059669'}>{stats.selected}</StatNumber>
					<StatLabel>{t('library.active')}</StatLabel>
				</StatBadge>
				<StatBadge>
					<StatNumber $color={settings.theme === 'dark' ? '#ffb630' : '#d97706'}>{stats.favorites}</StatNumber>
					<StatLabel>{t('library.favCount')}</StatLabel>
				</StatBadge>
			</StatsBar>

			{/* Toolbar */}
			<Toolbar>
				{/* Filter dropdown */}
				<DropdownWrap ref={filterRef}>
					<ToolBtn
						$active={filter !== 'all' || filterOpen}
						onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }}
					>
						<FilterIcon />
						{filterLabel}
						{filter !== 'all' && <ActiveDot />}
					</ToolBtn>

					<AnimatePresence>
						{filterOpen && (
							<Popover
								initial={{ opacity: 0, y: -8, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -8, scale: 0.96 }}
								transition={{ duration: 0.15 }}
							>
								<PopoverTitle>{i18n.language === 'ru' ? 'Фильтр' : 'Filter'}</PopoverTitle>
								<FilterGrid>
									<FilterTile
										$active={filter === 'all'}
										onClick={() => { setFilter('all'); setFilterOpen(false); }}
									>
										<TileIcon>
											<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<circle cx="12" cy="12" r="10" />
												<line x1="2" y1="12" x2="22" y2="12" />
												<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
											</svg>
										</TileIcon>
										<TileLabel>{t('library.filterAll')}</TileLabel>
										<TileCount>{stats.total}</TileCount>
									</FilterTile>
									<FilterTile
										$active={filter === 'selected'}
										onClick={() => { setFilter('selected'); setFilterOpen(false); }}
									>
										<TileIcon>
											<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
												<polyline points="22 4 12 14.01 9 11.01" />
											</svg>
										</TileIcon>
										<TileLabel>{t('library.filterActive')}</TileLabel>
										<TileCount>{stats.selected}</TileCount>
									</FilterTile>
									<FilterTile
										$active={filter === 'favorites'}
										onClick={() => { setFilter('favorites'); setFilterOpen(false); }}
									>
										<TileIcon>&#9733;</TileIcon>
										<TileLabel>{t('library.filterFavorites')}</TileLabel>
										<TileCount>{stats.favorites}</TileCount>
									</FilterTile>
									<FilterTile
										$active={false}
										onClick={() => { setFilter('all'); setSearch(''); setFilterOpen(false); }}
									>
										<TileIcon>
											<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
											</svg>
										</TileIcon>
										<TileLabel>{i18n.language === 'ru' ? 'Сброс' : 'Reset'}</TileLabel>
									</FilterTile>
								</FilterGrid>
							</Popover>
						)}
					</AnimatePresence>
				</DropdownWrap>

				{/* Sort dropdown */}
				<DropdownWrap ref={sortRef}>
					<ToolBtn
						$active={sort !== 'alpha' || sortOpen}
						onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); }}
					>
						<SortIcon />
						{sortLabels[sort]}
					</ToolBtn>

					<AnimatePresence>
						{sortOpen && (
							<Popover
								initial={{ opacity: 0, y: -8, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -8, scale: 0.96 }}
								transition={{ duration: 0.15 }}
								style={{ minWidth: 180 }}
							>
								<PopoverTitle>{i18n.language === 'ru' ? 'Сортировка' : 'Sort'}</PopoverTitle>
								<SortList>
									{(Object.keys(sortLabels) as SortMode[]).map((mode) => (
										<SortItem
											key={mode}
											$active={sort === mode}
											onClick={() => { setSort(mode); setSortOpen(false); }}
										>
											<SortCheck>{sort === mode ? '✓' : ''}</SortCheck>
											{sortLabels[mode]}
										</SortItem>
									))}
								</SortList>
							</Popover>
						)}
					</AnimatePresence>
				</DropdownWrap>

				{/* Search */}
				<SearchWrap>
					<SearchIcon><SearchSvg /></SearchIcon>
					<SearchInput
						placeholder={t('search.placeholder')}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</SearchWrap>
			</Toolbar>

			{/* Category tabs */}
			<TabsRow>
				<Tab $active={category === 'all'} onClick={() => setCategory('all')}>
					🌐 {i18n.language === 'ru' ? 'Все' : 'All'}
					<TabCount>{categoryCounts.all || 0}</TabCount>
				</Tab>
				{ALL_CATEGORIES.filter((cat) => (categoryCounts[cat] || 0) > 0).map((cat) => (
					<Tab key={cat} $active={category === cat} onClick={() => setCategory(cat)}>
						{CATEGORY_ICONS[cat]} {({ ru: CATEGORY_LABELS_RU, ja: CATEGORY_LABELS_JA, es: CATEGORY_LABELS_ES }[i18n.language] || CATEGORY_LABELS_EN)[cat]}
						<TabCount>{categoryCounts[cat]}</TabCount>
					</Tab>
				))}
			</TabsRow>

			{/* Grid */}
			{currencies.length === 0 ? (
				<NoResults>{t('search.noResults')}</NoResults>
			) : (
				<CardsGrid>
						{currencies.map((code) => {
							const isSelected = settings.selectedCurrencies.includes(code);
							const isFav = settings.favoriteCurrencies.includes(code);
							const rate = latestRates?.[code];
							const isBase = code === settings.baseCurrency;

							return (
								<CurrCard
									key={code}
									$selected={isSelected}
									onClick={(e) => toggleSelected(code, e)}
								>
									<CardHeader>
										<FlagWrap>{CURRENCY_FLAGS[code]}</FlagWrap>
										<CardActions>
											<IconBtn
												$active={isFav}
												onClick={(e) => toggleFavorite(code, e)}
												title={isFav ? t('favorites.remove') : t('favorites.add')}
											>
												{isFav ? '\u2605' : '\u2606'}
											</IconBtn>
											{isSelected ? (
												<SelectedBadge title="Active">{'\u2713'}</SelectedBadge>
											) : (
												<IconBtn onClick={(e) => toggleSelected(code, e)} title="Add to dashboard">+</IconBtn>
											)}
										</CardActions>
									</CardHeader>

									<CurrName>{getCurrencyName(code, i18n.language)}</CurrName>

									<MetaRow>
										<div>
											<MetaLabel>Code</MetaLabel>
											<MetaValue style={{ display: 'block' }}>{code}</MetaValue>
										</div>
										<div style={{ textAlign: 'right' }}>
											<MetaLabel>Symbol</MetaLabel>
											<MetaValue style={{ display: 'block' }}>{CURRENCY_SYMBOLS[code] || '—'}</MetaValue>
										</div>
									</MetaRow>

									<CardDivider />

									<RateRow>
										<RateLabel>{isBase ? 'Base' : 'Rate'}</RateLabel>
										<RateValue $hasRate={rate != null || isBase}>
											{isBase ? '1.0000' : rate != null ? fmtRate(rate, code, i18n.language) : '—'}
										</RateValue>
									</RateRow>
								</CurrCard>
							);
						})}
				</CardsGrid>
			)}
		</Section>
	);
};

export default CurrencyLibrary;
