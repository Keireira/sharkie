'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useAppSettings, type ViewMode } from '@/providers/Providers';
import { useHealthQuery, useCurrenciesQuery } from '@/hooks/useRates';
import { CURRENCY_FLAGS, getCurrencyName, matchesCurrencySearch, getCurrencyCategory, ALL_CATEGORIES, CATEGORY_LABELS_EN, CATEGORY_LABELS_RU, CATEGORY_LABELS_JA, CATEGORY_LABELS_ES, CATEGORY_ICONS, type CurrencyCategory } from '@/lib/currencies';
import { format, subWeeks, subMonths, subYears } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const SIDEBAR_WIDTH = 260;

const NAV_SECTIONS = [
	{
		labelKey: 'sidebar.sectionNav',
		items: [
			{ id: 'cards', key: 'sidebar.rates', icon: 'cards' },
			{ id: 'chart', key: 'sidebar.chart', icon: 'chart' },
			{ id: 'map', key: 'sidebar.map', icon: 'map' }
		]
	},
	{
		labelKey: 'sidebar.sectionData',
		items: [
			{ id: 'heatmap', key: 'sidebar.heatmap', icon: 'heatmap' },
			{ id: 'comparison', key: 'sidebar.comparison', icon: 'comparison' },
			{ id: 'history', key: 'sidebar.history', icon: 'history' },
			{ id: 'library', key: 'sidebar.library', icon: 'library' }
		]
	}
];

const ALL_NAV_IDS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.id));

type Period = 'week' | 'month' | 'quarter' | 'halfYear' | 'year';
const PERIODS: Period[] = ['week', 'month', 'quarter', 'halfYear', 'year'];

/* ── Shell ─────────────────────────────── */

const Wrapper = styled.aside`
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width: ${SIDEBAR_WIDTH}px;
	display: flex;
	flex-direction: column;
	background: ${({ theme }) => theme.colors.bg};
	border-right: 1px solid ${({ theme }) => theme.colors.border};
	z-index: 200;

	@media (max-width: 768px) {
		transform: translateX(-100%);
		pointer-events: none;
	}
`;

const MobileSidebar = styled(motion.aside)`
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width: ${SIDEBAR_WIDTH}px;
	display: flex;
	flex-direction: column;
	background: ${({ theme }) => theme.colors.bg};
	border-right: 1px solid ${({ theme }) => theme.colors.border};
	z-index: 300;
`;

const Backdrop = styled(motion.div)`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 299;
`;

/* ── Logo ─────────────────────────────── */

const LogoArea = styled.div`
	padding: 32px 20px 28px;
	display: flex;
	align-items: center;
	gap: 12px;
`;

const LogoIcon = styled.div`
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: ${({ theme }) =>
		theme.name === 'light'
			? 'linear-gradient(135deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)'
			: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	flex-shrink: 0;
`;

const LogoTextWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
`;

const LogoName = styled.span`
	font-size: 18px;
	font-weight: 700;
	letter-spacing: -0.02em;
	color: ${({ theme }) => theme.colors.text};
`;

const LogoSub = styled.span`
	font-size: 11px;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.textMuted};
	display: flex;
	align-items: center;
	gap: 6px;
`;

const HealthDot = styled.div<{ $status: 'online' | 'offline' | 'connecting' }>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${({ $status, theme }) =>
		$status === 'online' ? theme.colors.success
		: $status === 'connecting' ? theme.colors.warning
		: theme.colors.danger};
	box-shadow: 0 0 6px ${({ $status, theme }) =>
		($status === 'online' ? theme.colors.success
		: $status === 'connecting' ? theme.colors.warning
		: theme.colors.danger) + '80'};
`;

/* ── Base currency ─────────────────────── */

const WidgetArea = styled.div`
	padding: 0 16px 20px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	overflow: visible;
	position: relative;
	z-index: 10;
`;

const WidgetLabel = styled.span`
	font-size: 9px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: ${({ theme }) => theme.colors.textMuted};
	padding: 0 4px;
`;

const BaseButton = styled.button`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 8px 10px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 10px;
	background: ${({ theme }) => theme.colors.bgSecondary};
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		border-color: ${({ theme }) => theme.colors.borderHover};
	}
`;

const BaseFlag = styled.span`
	font-size: 20px;
	line-height: 1;
`;

const BaseInfo = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	text-align: left;
`;

const BaseCode = styled.span`
	font-size: 14px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	line-height: 1.2;
`;

const BaseName = styled.span`
	font-size: 10px;
	color: ${({ theme }) => theme.colors.textMuted};
`;

const Chevron = styled.span`
	color: ${({ theme }) => theme.colors.textMuted};
`;

const DropArea = styled.div`
	position: relative;
	z-index: 100;
`;

const Dropdown = styled(motion.div)`
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	width: 260px;
	max-height: 280px;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 10px;
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	z-index: 200;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const FixedDropdown = styled(motion.div)`
	position: fixed;
	width: 244px;
	max-height: 280px;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 10px;
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	z-index: 9999;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const DSearch = styled.input`
	border: none;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.text};
	padding: 10px 12px;
	font-size: 13px;
	outline: none;
	font-family: inherit;
	&::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const DList = styled.div`
	overflow-y: auto;
	flex: 1;
	padding: 4px;
`;

const DItem = styled.button<{ $selected?: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 7px 10px;
	border: none;
	border-radius: 8px;
	background: ${({ $selected, theme }) => ($selected ? theme.colors.accentGlow : 'transparent')};
	color: ${({ theme }) => theme.colors.text};
	font-size: 13px;
	cursor: pointer;
	text-align: left;
	transition: background 0.1s;
	&:hover { background: ${({ theme }) => theme.colors.bgSecondary}; }
`;

const DFlag = styled.span`
	font-size: 16px;
	line-height: 1;
`;

const DCode = styled.span`
	font-weight: 700;
	min-width: 30px;
`;

const DName = styled.span`
	color: ${({ theme }) => theme.colors.textMuted};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 11px;
`;

const DSep = styled.div`
	height: 1px;
	background: ${({ theme }) => theme.colors.border};
	margin: 3px 10px;
`;

const DCatLabel = styled.div`
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

/* ── Period pills ─────────────────────── */

const PillsRow = styled.div`
	display: flex;
	gap: 4px;
`;

const Pill = styled.button<{ $active: boolean }>`
	flex: 1;
	padding: 6px 0;
	border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.border)};
	border-radius: 8px;
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : theme.colors.bgSecondary)};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textSecondary)};
	font-size: 11px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.15s;
	text-align: center;
	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}
`;

const DateRow = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
`;

const DateInput = styled.input`
	flex: 1;
	height: 32px;
	padding: 0 8px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.text};
	font-size: 11px;
	font-weight: 600;
	outline: none;
	font-family: inherit;
	min-width: 0;
	&:focus {
		border-color: ${({ theme }) => theme.colors.accent};
	}
	&::-webkit-calendar-picker-indicator {
		opacity: 0.5;
		cursor: pointer;
	}
`;

const DateSep = styled.span`
	color: ${({ theme }) => theme.colors.textMuted};
	font-size: 12px;
	flex-shrink: 0;
`;

/* ── Currency chips ─────────────────────────── */

const ChipsWrap = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 5px;
`;

const CurrChip = styled.button`
	display: flex;
	align-items: center;
	gap: 4px;
	height: 28px;
	padding: 0 4px 0 7px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 8px;
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.text};
	font-size: 11px;
	font-weight: 600;
	cursor: default;
	transition: all 0.15s;
`;

const ChipFlag = styled.span`
	font-size: 13px;
	line-height: 1;
`;

const ChipRemove = styled.span`
	width: 16px;
	height: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	font-size: 12px;
	color: ${({ theme }) => theme.colors.textMuted};
	cursor: pointer;
	transition: all 0.15s;
	&:hover {
		background: ${({ theme }) => theme.colors.danger}20;
		color: ${({ theme }) => theme.colors.danger};
	}
`;

const AddChipBtn = styled.button`
	display: flex;
	align-items: center;
	gap: 3px;
	height: 28px;
	padding: 0 10px;
	border: 1px dashed ${({ theme }) => theme.colors.border};
	border-radius: 8px;
	background: transparent;
	color: ${({ theme }) => theme.colors.textMuted};
	font-size: 11px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s;
	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
		background: ${({ theme }) => theme.colors.accentGlow};
	}
`;

/* ── Navigation ─────────────────────────────── */

const ScrollArea = styled.div`
	flex: 1;
	overflow-y: auto;
	min-height: 0;
	scrollbar-width: thin;
	&::-webkit-scrollbar { width: 4px; }
	&::-webkit-scrollbar-thumb {
		background: rgba(128,128,128,0.3);
		border-radius: 2px;
	}
`;

const NavWrap = styled.nav`
	padding: 8px 16px 20px;
	display: flex;
	flex-direction: column;
	gap: 24px;
`;

const SectionLabel = styled.span`
	font-size: 10px;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: ${({ theme }) => theme.colors.textMuted};
	padding: 0 8px;
	margin-bottom: 2px;
`;

const SectionGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const NavItem = styled.button<{ $active: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 9px 12px;
	border: none;
	border-radius: 10px;
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : 'transparent')};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textSecondary)};
	cursor: pointer;
	font-size: 13px;
	font-weight: ${({ $active }) => ($active ? 600 : 500)};
	text-align: left;
	transition: all 0.15s ease;
	position: relative;

	${({ $active, theme }) =>
		$active &&
		`
		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 3px;
			height: 20px;
			border-radius: 0 3px 3px 0;
			background: ${theme.colors.accent};
		}
	`}

	&:hover {
		background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : theme.colors.bgSecondary)};
		color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.text)};
	}

	svg {
		flex-shrink: 0;
		opacity: ${({ $active }) => ($active ? 1 : 0.7)};
	}
`;

const CalcButton = styled.button<{ $open?: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	width: calc(100% - 32px);
	margin: 0 16px 12px;
	padding: 10px 14px;
	border: 1px solid ${({ $open, theme }) => $open ? theme.colors.accent : theme.colors.border};
	border-radius: 10px;
	background: ${({ $open, theme }) => $open ? theme.colors.accentGlow : theme.colors.bgSecondary};
	color: ${({ $open, theme }) => $open ? theme.colors.accent : theme.colors.text};
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	text-align: left;
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
	}

	svg { flex-shrink: 0; width: 16px; height: 16px; }
`;

/* ── Bottom area ─────────────────────────────── */

const BottomArea = styled.div`
	padding: 16px;
	border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const SettingsRow = styled.div`
	display: flex;
	gap: 6px;
`;

const ToggleBtn = styled.button<{ $active?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	flex: 1;
	height: 36px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 10px;
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : theme.colors.bgSecondary)};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textSecondary)};
	cursor: pointer;
	font-size: 12px;
	font-weight: 600;
	transition: all 0.15s ease;
	letter-spacing: 0.02em;
	&:hover {
		border-color: ${({ theme }) => theme.colors.borderHover};
		color: ${({ theme }) => theme.colors.text};
	}
	svg { width: 14px; height: 14px; }
`;

/* ── Icons ─────────────────────────────── */

const NavIcon = ({ id }: { id: string }) => {
	const props = {
		width: 18, height: 18, fill: 'none', stroke: 'currentColor',
		strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const
	};
	switch (id) {
		case 'controls':
			return (<svg {...props} viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>);
		case 'chart':
			return (<svg {...props} viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
		case 'cards':
			return (<svg {...props} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
		case 'map':
			return (<svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>);
		case 'heatmap':
			return (<svg {...props} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>);
		case 'comparison':
			return (<svg {...props} viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
		case 'table':
			return (<svg {...props} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>);
		case 'history':
			return (<svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
		case 'today':
			return (<svg {...props} viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
		case 'library':
			return (<svg {...props} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="13" y2="11"/></svg>);
		default:
			return null;
	}
};

/* ── Helpers ─────────────────────────────── */

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
	useEffect(() => {
		const listener = (e: MouseEvent | TouchEvent) => {
			if (!ref.current || ref.current.contains(e.target as Node)) return;
			handler();
		};
		document.addEventListener('mousedown', listener);
		return () => document.removeEventListener('mousedown', listener);
	}, [ref, handler]);
}

/* ── Sidebar content ─────────────────────────────── */

const SidebarContent = ({
	activeId,
	onNavClick
}: {
	activeId: string;
	onNavClick: (id: string) => void;
}) => {
	const { t, i18n } = useTranslation();
	const { settings, setSettings, calcOpen, setCalcOpen, viewMode, setViewMode } = useAppSettings();
	const { data: health, isLoading: healthLoading, isError: healthError } = useHealthQuery();
	const { data: apiCurrencies } = useCurrenciesQuery();

	// Base currency dropdown
	const [baseOpen, setBaseOpen] = useState(false);
	const [baseSearch, setBaseSearch] = useState('');
	const [basePos, setBasePos] = useState<{ top: number; left: number } | null>(null);
	const baseRef = useRef<HTMLDivElement>(null);
	const baseBtnRef = useRef<HTMLButtonElement>(null);
	const baseDropRef = useRef<HTMLDivElement>(null);
	const baseSearchRef = useRef<HTMLInputElement>(null);

	// Add currency dropdown
	const [addOpen, setAddOpen] = useState(false);
	const [addSearch, setAddSearch] = useState('');
	const [addPos, setAddPos] = useState<{ top: number; left: number } | null>(null);
	const addRef = useRef<HTMLDivElement>(null);
	const addBtnRef = useRef<HTMLButtonElement>(null);
	const addDropRef = useRef<HTMLDivElement>(null);
	const addSearchRef = useRef<HTMLInputElement>(null);

	// Close base dropdown when clicking outside both the button and the dropdown
	useEffect(() => {
		if (!baseOpen) return;
		const listener = (e: MouseEvent | TouchEvent) => {
			const target = e.target as Node;
			if (baseRef.current?.contains(target)) return;
			if (baseDropRef.current?.contains(target)) return;
			setBaseOpen(false);
			setBaseSearch('');
		};
		document.addEventListener('mousedown', listener);
		return () => document.removeEventListener('mousedown', listener);
	}, [baseOpen]);
	// Close add dropdown when clicking outside both the button and the dropdown
	useEffect(() => {
		if (!addOpen) return;
		const listener = (e: MouseEvent | TouchEvent) => {
			const target = e.target as Node;
			if (addRef.current?.contains(target)) return;
			if (addDropRef.current?.contains(target)) return;
			setAddOpen(false);
			setAddSearch('');
		};
		document.addEventListener('mousedown', listener);
		return () => document.removeEventListener('mousedown', listener);
	}, [addOpen]);
	useEffect(() => { if (baseOpen) setTimeout(() => baseSearchRef.current?.focus(), 0); }, [baseOpen]);
	useEffect(() => { if (addOpen) setTimeout(() => addSearchRef.current?.focus(), 0); }, [addOpen]);

	const allCurrencies = useMemo(() => {
		if (apiCurrencies?.length) return apiCurrencies.sort();
		return ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KZT', 'RUB'];
	}, [apiCurrencies]);

	const groupByCat = useCallback((list: string[]) => {
		const labelMap: Record<string, Record<CurrencyCategory, string>> = {
			ru: CATEGORY_LABELS_RU, ja: CATEGORY_LABELS_JA, es: CATEGORY_LABELS_ES
		};
		const labels = labelMap[i18n.language] || CATEGORY_LABELS_EN;
		const groups: { cat: CurrencyCategory; label: string; icon: string; items: string[] }[] = [];
		for (const cat of ALL_CATEGORIES) {
			const items = list.filter((c) => getCurrencyCategory(c) === cat);
			if (items.length > 0) {
				groups.push({ cat, label: labels[cat], icon: CATEGORY_ICONS[cat], items });
			}
		}
		return groups;
	}, [i18n.language]);

	const baseFiltered = useMemo(() => {
		const filtered = allCurrencies.filter((c) => matchesCurrencySearch(c, baseSearch, i18n.language));
		return groupByCat(filtered);
	}, [allCurrencies, baseSearch, i18n.language, groupByCat]);

	const selectBase = (code: string) => {
		setSettings({ baseCurrency: code });
		setBaseOpen(false);
		setBaseSearch('');
	};

	const removeCurrency = (code: string) => {
		if (settings.selectedCurrencies.length <= 1) return;
		setSettings({ selectedCurrencies: settings.selectedCurrencies.filter((c) => c !== code) });
	};

	const addCurrency = (code: string) => {
		if (!settings.selectedCurrencies.includes(code) && settings.selectedCurrencies.length < 6) {
			setSettings({ selectedCurrencies: [...settings.selectedCurrencies, code] });
		}
		setAddOpen(false);
		setAddSearch('');
	};

	const addFiltered = useMemo(() => {
		const available = allCurrencies.filter(
			(c) => !settings.selectedCurrencies.includes(c) && c !== settings.baseCurrency
		);
		const filtered = available.filter((c) => matchesCurrencySearch(c, addSearch, i18n.language));
		return groupByCat(filtered);
	}, [allCurrencies, addSearch, settings.selectedCurrencies, settings.baseCurrency, i18n.language, groupByCat]);

	// Period
	const effectiveDates = useMemo(() => {
		if (settings.customFrom && settings.customTo) {
			return { from: settings.customFrom, to: settings.customTo };
		}
		const to = new Date();
		let from: Date;
		switch (settings.period) {
			case 'week': from = subWeeks(to, 1); break;
			case 'month': from = subMonths(to, 1); break;
			case 'quarter': from = subMonths(to, 3); break;
			case 'halfYear': from = subMonths(to, 6); break;
			case 'year': from = subYears(to, 1); break;
		}
		return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
	}, [settings.period, settings.customFrom, settings.customTo]);

	const handlePeriodClick = (p: Period) => {
		setSettings({ period: p, customFrom: '', customTo: '' });
	};
	const handleDateFromChange = (value: string) => {
		setSettings({ customFrom: value, customTo: settings.customTo || effectiveDates.to });
	};
	const handleDateToChange = (value: string) => {
		setSettings({ customTo: value, customFrom: settings.customFrom || effectiveDates.from });
	};

	// Theme & lang
	const toggleTheme = () => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
	const LANGS: Array<'en' | 'ru' | 'ja' | 'es'> = ['en', 'ru', 'ja', 'es'];
	const toggleLang = () => {
		const idx = LANGS.indexOf(settings.language);
		setSettings({ language: LANGS[(idx + 1) % LANGS.length] });
	};
	const isDark = settings.theme === 'dark';

	return (
		<>
			<LogoArea>
				<LogoIcon>
					<svg width="22" height="22" viewBox="0 0 32 32" fill="none">
						<path d="M3 10 Q1 7 2 4 L5 9 Z" fill="#5B8FA1" />
						<path d="M3 18 Q1 21 2 24 L5 19 Z" fill="#5B8FA1" />
						<path d="M5 8 Q10 3 20 5 Q28 7 30 14 Q30 21 22 24 Q14 26 8 22 Q3 18 5 8 Z" fill="#6B9DAF" />
						<path d="M10 14 Q14 10 22 12 Q27 14 27 18 Q24 23 16 24 Q10 23 8 19 Q7 16 10 14 Z" fill="#EDF2F7" />
						<path d="M14 5 L12 9 L17 8 Z" fill="#5B8FA1" />
						<path d="M16 20 Q14 25 12 26 Q13 23 14 21 Z" fill="#5B8FA1" />
						<circle cx="24" cy="13" r="3" fill="#2D3748" />
						<circle cx="25" cy="12" r="1" fill="white" />
						<path d="M26 18 L27.5 17 L29 18.5 L30 17" stroke="#2D3748" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</LogoIcon>
				<LogoTextWrap>
					<LogoName>Sharkie</LogoName>
					<LogoSub>
						{(() => {
							const status = healthLoading ? 'connecting' : health?.status === 'ok' ? 'online' : healthError ? 'offline' : 'connecting';
							const label = status === 'online' ? t('health.online') : status === 'offline' ? t('health.offline') : t('health.checking');
							return <><HealthDot $status={status} title={label} />{label}</>;
						})()}
					</LogoSub>
				</LogoTextWrap>
			</LogoArea>

			{/* Base currency + Period */}
			<ScrollArea>
		<WidgetArea>
				<WidgetLabel>{t('controls.base')}</WidgetLabel>
				<div ref={baseRef}>
					<BaseButton ref={baseBtnRef} onClick={() => {
						if (!baseOpen && baseBtnRef.current) {
							const rect = baseBtnRef.current.getBoundingClientRect();
							setBasePos({ top: rect.bottom + 4, left: rect.left });
						}
						setBaseOpen((v) => !v);
					}}>
						<BaseFlag>{CURRENCY_FLAGS[settings.baseCurrency] || ''}</BaseFlag>
						<BaseInfo>
							<BaseCode>{settings.baseCurrency}</BaseCode>
							<BaseName>{getCurrencyName(settings.baseCurrency, i18n.language)}</BaseName>
						</BaseInfo>
						<Chevron>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</Chevron>
					</BaseButton>
				</div>

				<WidgetLabel style={{ marginTop: 6 }}>{t('controls.from')}</WidgetLabel>
				<PillsRow>
					{PERIODS.map((p) => (
						<Pill key={p} $active={settings.period === p && !settings.customFrom} onClick={() => handlePeriodClick(p)}>
							{t(`controls.period.${p}`)}
						</Pill>
					))}
				</PillsRow>
				<DateRow>
					<DateInput type="date" value={effectiveDates.from} onChange={(e) => handleDateFromChange(e.target.value)} />
					<DateSep>→</DateSep>
					<DateInput type="date" value={effectiveDates.to} onChange={(e) => handleDateToChange(e.target.value)} />
				</DateRow>

				<WidgetLabel style={{ marginTop: 10 }}>{t('controls.currencies')}</WidgetLabel>
				<ChipsWrap>
					{settings.selectedCurrencies.map((code) => (
						<CurrChip key={code}>
							<ChipFlag>{CURRENCY_FLAGS[code] || ''}</ChipFlag>
							{code}
							<ChipRemove onClick={() => removeCurrency(code)}>&times;</ChipRemove>
						</CurrChip>
					))}
					{settings.selectedCurrencies.length < 6 && <div ref={addRef} style={{ position: 'relative' }}>
						<AddChipBtn ref={addBtnRef} onClick={() => {
							if (!addOpen && addBtnRef.current) {
								const rect = addBtnRef.current.getBoundingClientRect();
								setAddPos({ top: rect.bottom + 4, left: rect.left });
							}
							setAddOpen((v) => !v);
						}}>+ {t('controls.addCurrency')}</AddChipBtn>
					</div>}
				</ChipsWrap>
			</WidgetArea>

			<NavWrap>
				{NAV_SECTIONS.map((section) => (
					<SectionGroup key={section.labelKey}>
						<SectionLabel>{t(section.labelKey)}</SectionLabel>
						{section.items.map((item) => (
							<NavItem key={item.id} $active={activeId === item.id} onClick={() => onNavClick(item.id)}>
								<NavIcon id={item.icon} />
								{t(item.key)}
							</NavItem>
						))}
					</SectionGroup>
				))}
			</NavWrap>

		</ScrollArea>

			<BottomArea>
				<SettingsRow style={{ marginBottom: 6 }}>
					{viewMode === 'dashboard' && (
						<ToggleBtn
							$active={calcOpen}
							onClick={() => setCalcOpen((v: boolean) => !v)}
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="4" y="2" width="16" height="20" rx="2" />
								<line x1="8" y1="6" x2="16" y2="6" />
								<line x1="8" y1="10" x2="16" y2="10" />
								<line x1="8" y1="14" x2="8" y2="14.01" />
								<line x1="12" y1="14" x2="12" y2="14.01" />
								<line x1="16" y1="14" x2="16" y2="14.01" />
							</svg>
						</ToggleBtn>
					)}
					<ToggleBtn
						$active={viewMode === 'calculator'}
						onClick={() => setViewMode(viewMode === 'dashboard' ? 'calculator' : 'dashboard')}
					>
						{viewMode === 'calculator' ? (
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
								<line x1="1" y1="10" x2="23" y2="10" />
							</svg>
						) : (
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
								<polyline points="17 6 23 6 23 12" />
							</svg>
						)}
						{viewMode === 'calculator' ? t('sidebar.dashboard') : t('sidebar.calcMode', 'Calc Mode')}
					</ToggleBtn>
				</SettingsRow>
				<SettingsRow>
					<ToggleBtn onClick={toggleTheme} $active={isDark}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							{isDark ? (
								<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
							) : (
								<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
							)}
						</svg>
						{isDark ? t('sidebar.dark') : t('sidebar.light')}
					</ToggleBtn>
					<ToggleBtn onClick={toggleLang}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
						</svg>
						{LANGS[(LANGS.indexOf(settings.language) + 1) % LANGS.length].toUpperCase()}
					</ToggleBtn>
				</SettingsRow>
			</BottomArea>
			<AnimatePresence>
				{baseOpen && basePos && (
					<FixedDropdown
						ref={baseDropRef}
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.12 }}
						style={{ top: basePos.top, left: basePos.left }}
					>
						<DSearch
							ref={baseSearchRef}
							type="text"
							placeholder={i18n.language === 'ru' ? 'Поиск валюты...' : 'Search currency...'}
							value={baseSearch}
							onChange={(e) => setBaseSearch(e.target.value)}
							onClick={(e) => e.stopPropagation()}
						/>
						<DList>
							{baseFiltered.map((group) => (
								<React.Fragment key={group.cat}>
									<DCatLabel>{group.icon} {group.label}</DCatLabel>
									{group.items.map((c) => (
										<DItem key={c} $selected={c === settings.baseCurrency} onClick={() => selectBase(c)}>
											<DFlag>{CURRENCY_FLAGS[c] || ''}</DFlag>
											<DCode>{c}</DCode>
											<DName>{getCurrencyName(c, i18n.language)}</DName>
										</DItem>
									))}
								</React.Fragment>
							))}
						</DList>
					</FixedDropdown>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{addOpen && addPos && (
					<FixedDropdown
						ref={addDropRef}
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.12 }}
						style={{ top: addPos.top, left: addPos.left }}
					>
						<DSearch
							ref={addSearchRef}
							type="text"
							placeholder={i18n.language === 'ru' ? 'Поиск валюты...' : 'Search currency...'}
							value={addSearch}
							onChange={(e) => setAddSearch(e.target.value)}
						/>
						<DList>
							{addFiltered.map((group) => (
								<React.Fragment key={group.cat}>
									<DCatLabel>{group.icon} {group.label}</DCatLabel>
									{group.items.map((c) => (
										<DItem key={c} onClick={() => addCurrency(c)}>
											<DFlag>{CURRENCY_FLAGS[c] || ''}</DFlag>
											<DCode>{c}</DCode>
											<DName>{getCurrencyName(c, i18n.language)}</DName>
										</DItem>
									))}
								</React.Fragment>
							))}
						</DList>
					</FixedDropdown>
				)}
			</AnimatePresence>
		</>
	);
};

/* ── Main component ─────────────────────────────── */

const Sidebar = () => {
	const [activeId, setActiveId] = useState('today');
	const { sidebarOpen, setSidebarOpen } = useAppSettings();
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia('(max-width: 768px)');
		setIsMobile(mql.matches);
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	}, []);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) setActiveId(entry.target.id);
				}
			},
			{ rootMargin: '-20% 0px -60% 0px', threshold: 0 }
		);
		ALL_NAV_IDS.forEach((id) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});
		return () => observer.disconnect();
	}, []);

	const handleNavClick = useCallback(
		(id: string) => {
			document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			if (isMobile) setSidebarOpen(false);
		},
		[isMobile, setSidebarOpen]
	);

	return (
		<>
			<Wrapper>
				<SidebarContent activeId={activeId} onNavClick={handleNavClick} />
			</Wrapper>
			<AnimatePresence>
				{isMobile && sidebarOpen && (
					<>
						<Backdrop
							initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							onClick={() => setSidebarOpen(false)}
						/>
						<MobileSidebar
							initial={{ x: -SIDEBAR_WIDTH }} animate={{ x: 0 }} exit={{ x: -SIDEBAR_WIDTH }}
							transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						>
							<SidebarContent activeId={activeId} onNavClick={handleNavClick} />
						</MobileSidebar>
					</>
				)}
			</AnimatePresence>
		</>
	);
};

export default Sidebar;
