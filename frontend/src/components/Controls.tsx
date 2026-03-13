'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '@/providers/Providers';
import { CURRENCY_FLAGS, getCurrencyName, matchesCurrencySearch } from '@/lib/currencies';
import { useCurrenciesQuery } from '@/hooks/useRates';

/* ── Layout ──────────────────────────────────── */

const Card = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	padding: ${({ theme }) => theme.spacing.lg};
	box-shadow: ${({ theme }) => theme.colors.shadowSm};
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.md};

	@media (max-width: 768px) {
		padding: ${({ theme }) => theme.spacing.md};
	}
`;

const CardTitle = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const TitleBar = styled.div`
	width: 3px;
	height: 16px;
	border-radius: 2px;
	background: linear-gradient(180deg, ${({ theme }) => theme.colors.gradientStart}, ${({ theme }) => theme.colors.gradientEnd});
`;

const TitleText = styled.span`
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: ${({ theme }) => theme.colors.textMuted};
`;

/* ── Searchable dropdown ─────────────────────── */

const DropdownSearch = styled.input`
	border: none;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.text};
	padding: 12px 16px;
	font-size: 14px;
	outline: none;
	font-family: inherit;

	&::placeholder {
		color: ${({ theme }) => theme.colors.textMuted};
	}
`;

const DropdownList = styled.div`
	overflow-y: auto;
	flex: 1;
	padding: 4px;
`;

const DropdownItem = styled.button`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 10px 12px;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: transparent;
	color: ${({ theme }) => theme.colors.text};
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	text-align: left;
	transition: background 0.1s;

	&:hover {
		background: ${({ theme }) => theme.colors.bgSecondary};
	}
`;

const DropdownItemFlag = styled.span`
	font-size: 20px;
	line-height: 1;
	flex-shrink: 0;
`;

const DropdownItemCode = styled.span`
	font-weight: 700;
	min-width: 36px;
`;

const DropdownItemName = styled.span`
	color: ${({ theme }) => theme.colors.textMuted};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const DropdownSep = styled.div`
	height: 1px;
	background: ${({ theme }) => theme.colors.border};
	margin: 4px 12px;
`;

/* ── Currency chips ──────────────────────────── */

const ChipsWrap = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`;

const CurrChip = styled.button<{ $isFav: boolean }>`
	display: flex;
	align-items: center;
	gap: 6px;
	height: 34px;
	padding: 0 6px 0 10px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.text};
	font-size: 13px;
	font-weight: 600;
	cursor: default;
	transition: all 0.15s;
`;

const ChipFlag = styled.span`
	font-size: 16px;
	line-height: 1;
`;

const ChipStar = styled.span<{ $active: boolean }>`
	font-size: 13px;
	color: ${({ $active, theme }) => ($active ? theme.colors.warning : theme.colors.textMuted)};
	cursor: pointer;
	transition: color 0.15s;
	line-height: 1;

	&:hover {
		color: ${({ theme }) => theme.colors.warning};
	}
`;

const ChipRemove = styled.span`
	width: 22px;
	height: 22px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	font-size: 14px;
	color: ${({ theme }) => theme.colors.textMuted};
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		background: ${({ theme }) => theme.colors.danger}20;
		color: ${({ theme }) => theme.colors.danger};
	}
`;

const AddChip = styled.button`
	display: flex;
	align-items: center;
	gap: 4px;
	height: 34px;
	padding: 0 14px;
	border: 1px dashed ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	background: transparent;
	color: ${({ theme }) => theme.colors.textMuted};
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s;
	position: relative;

	&:hover {
		border-color: ${({ theme }) => theme.colors.accent};
		color: ${({ theme }) => theme.colors.accent};
		background: ${({ theme }) => theme.colors.accentGlow};
	}
`;

const AddDropdown = styled(motion.div)`
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	width: 280px;
	max-height: 320px;
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	z-index: 100;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

/* ── Helpers ──────────────────────────────────── */

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

/* ── Component ───────────────────────────────── */

const Controls = () => {
	const { t, i18n } = useTranslation();
	const { settings, setSettings } = useAppSettings();

	const [addOpen, setAddOpen] = useState(false);
	const [addSearch, setAddSearch] = useState('');
	const addRef = useRef<HTMLDivElement>(null);
	const addSearchRef = useRef<HTMLInputElement>(null);

	const { data: apiCurrencies } = useCurrenciesQuery();

	useClickOutside(addRef, useCallback(() => { setAddOpen(false); setAddSearch(''); }, []));

	useEffect(() => {
		if (addOpen) setTimeout(() => addSearchRef.current?.focus(), 0);
	}, [addOpen]);

	const allCurrencies = useMemo(() => {
		if (apiCurrencies?.length) return apiCurrencies.sort();
		return ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KZT', 'RUB', 'TRY', 'BRL',
			'AUD', 'CAD', 'CHF', 'INR', 'MXN', 'PLN', 'SEK', 'NOK', 'DKK',
			'CZK', 'HUF', 'ILS', 'SGD', 'HKD', 'KRW', 'THB', 'ZAR'];
	}, [apiCurrencies]);

	const removeCurrency = (code: string) => {
		if (settings.selectedCurrencies.length <= 1) return;
		setSettings({ selectedCurrencies: settings.selectedCurrencies.filter((c) => c !== code) });
	};

	const addCurrency = (code: string) => {
		if (!settings.selectedCurrencies.includes(code)) {
			setSettings({ selectedCurrencies: [...settings.selectedCurrencies, code] });
		}
		setAddOpen(false);
		setAddSearch('');
	};

	const toggleFavorite = (code: string) => {
		const favs = settings.favoriteCurrencies;
		if (favs.includes(code)) {
			setSettings({ favoriteCurrencies: favs.filter((c) => c !== code) });
		} else {
			setSettings({ favoriteCurrencies: [...favs, code] });
		}
	};

	const addFiltered = useMemo(() => {
		const available = allCurrencies.filter(
			(c) => !settings.selectedCurrencies.includes(c) && c !== settings.baseCurrency
		);
		const filtered = available.filter((c) =>
			matchesCurrencySearch(c, addSearch, i18n.language)
		);
		const favs = new Set(settings.favoriteCurrencies);
		const fav = filtered.filter((c) => favs.has(c));
		const rest = filtered.filter((c) => !favs.has(c));
		return { fav, rest };
	}, [allCurrencies, addSearch, settings.selectedCurrencies, settings.baseCurrency, settings.favoriteCurrencies, i18n.language]);

	return (
		<Card>
			<CardTitle>
				<TitleBar />
				<TitleText>{t('controls.currencies')}</TitleText>
			</CardTitle>

			<ChipsWrap>
				{settings.selectedCurrencies.map((code) => {
					const isFav = settings.favoriteCurrencies.includes(code);
					return (
						<CurrChip key={code} $isFav={isFav}>
							<ChipFlag>{CURRENCY_FLAGS[code] || ''}</ChipFlag>
							{code}
							<ChipStar
								$active={isFav}
								onClick={() => toggleFavorite(code)}
								title={isFav ? t('favorites.remove') : t('favorites.add')}
							>
								{isFav ? '\u2605' : '\u2606'}
							</ChipStar>
							<ChipRemove
								onClick={() => removeCurrency(code)}
								title={i18n.language === 'ru' ? 'Убрать' : 'Remove'}
							>
								&times;
							</ChipRemove>
						</CurrChip>
					);
				})}

				<div ref={addRef} style={{ position: 'relative' }}>
					<AddChip onClick={() => setAddOpen((v) => !v)}>
						+ {t('controls.addCurrency')}
					</AddChip>

					<AnimatePresence>
						{addOpen && (
							<AddDropdown
								initial={{ opacity: 0, y: -8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.15 }}
							>
								<DropdownSearch
									ref={addSearchRef}
									type="text"
									placeholder={i18n.language === 'ru' ? 'Поиск валюты...' : 'Search currency...'}
									value={addSearch}
									onChange={(e) => setAddSearch(e.target.value)}
								/>
								<DropdownList>
									{addFiltered.fav.map((c) => (
										<DropdownItem key={c} onClick={() => addCurrency(c)}>
											<DropdownItemFlag>{CURRENCY_FLAGS[c] || ''}</DropdownItemFlag>
											<DropdownItemCode>{c}</DropdownItemCode>
											<DropdownItemName>{getCurrencyName(c, i18n.language)}</DropdownItemName>
										</DropdownItem>
									))}
									{addFiltered.fav.length > 0 && addFiltered.rest.length > 0 && <DropdownSep />}
									{addFiltered.rest.map((c) => (
										<DropdownItem key={c} onClick={() => addCurrency(c)}>
											<DropdownItemFlag>{CURRENCY_FLAGS[c] || ''}</DropdownItemFlag>
											<DropdownItemCode>{c}</DropdownItemCode>
											<DropdownItemName>{getCurrencyName(c, i18n.language)}</DropdownItemName>
										</DropdownItem>
									))}
								</DropdownList>
							</AddDropdown>
						)}
					</AnimatePresence>
				</div>
			</ChipsWrap>
		</Card>
	);
};

export default Controls;
