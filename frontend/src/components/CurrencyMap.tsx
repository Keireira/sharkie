'use client';

import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
	ComposableMap,
	Geographies,
	Geography,
	ZoomableGroup
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/* Approximate centroids [lon, lat] for each currency's primary country */
const CURRENCY_CENTROIDS: Record<string, [number, number]> = {
	USD: [-98, 39],
	EUR: [10, 48],
	GBP: [-2, 54],
	JPY: [138, 36],
	CNY: [104, 35],
	KZT: [67, 48],
	RUB: [60, 56],
	TRY: [35, 39],
	BRL: [-51, -14],
	AUD: [134, -25],
	CAD: [-96, 56],
	CHF: [8, 47],
	INR: [79, 21],
	MXN: [-102, 23],
	PLN: [20, 52],
	SEK: [16, 62],
	NOK: [10, 64],
	DKK: [10, 56],
	CZK: [15, 50],
	HUF: [19, 47],
	ILS: [35, 31],
	SGD: [104, 1],
	HKD: [114, 22],
	KRW: [128, 36],
	THB: [101, 15],
	ZAR: [25, -29]
};

const CURRENCY_COUNTRIES: Record<string, { countries: string[]; label: string }> = {
	USD: { countries: ['840'], label: 'United States' },
	EUR: {
		countries: ['276', '250', '380', '724', '528', '056', '040', '620', '246', '372', '300', '233', '428', '440', '442', '470', '703', '705', '196'],
		label: 'Eurozone'
	},
	GBP: { countries: ['826'], label: 'United Kingdom' },
	JPY: { countries: ['392'], label: 'Japan' },
	CNY: { countries: ['156'], label: 'China' },
	KZT: { countries: ['398'], label: 'Kazakhstan' },
	RUB: { countries: ['643'], label: 'Russia' },
	TRY: { countries: ['792'], label: 'Turkey' },
	BRL: { countries: ['076'], label: 'Brazil' },
	AUD: { countries: ['036'], label: 'Australia' },
	CAD: { countries: ['124'], label: 'Canada' },
	CHF: { countries: ['756'], label: 'Switzerland' },
	INR: { countries: ['356'], label: 'India' },
	MXN: { countries: ['484'], label: 'Mexico' },
	PLN: { countries: ['616'], label: 'Poland' },
	SEK: { countries: ['752'], label: 'Sweden' },
	NOK: { countries: ['578'], label: 'Norway' },
	DKK: { countries: ['208'], label: 'Denmark' },
	CZK: { countries: ['203'], label: 'Czech Republic' },
	HUF: { countries: ['348'], label: 'Hungary' },
	ILS: { countries: ['376'], label: 'Israel' },
	SGD: { countries: ['702'], label: 'Singapore' },
	HKD: { countries: ['344'], label: 'Hong Kong' },
	KRW: { countries: ['410'], label: 'South Korea' },
	THB: { countries: ['764'], label: 'Thailand' },
	ZAR: { countries: ['710'], label: 'South Africa' }
};

// Reverse mapping: country numeric code -> currency code
const COUNTRY_TO_CURRENCY: Record<string, string> = {};
for (const [currency, { countries }] of Object.entries(CURRENCY_COUNTRIES)) {
	for (const code of countries) {
		COUNTRY_TO_CURRENCY[code] = currency;
	}
}

import { CURRENCY_PALETTE } from '@/lib/currencies';

const PALETTE = CURRENCY_PALETTE;

/* Compute center + zoom to fit all active currencies */
function computeFocus(currencies: string[]): { center: [number, number]; zoom: number } {
	const points = currencies
		.map((c) => CURRENCY_CENTROIDS[c])
		.filter((p): p is [number, number] => !!p);

	if (points.length === 0) return { center: [10, 20], zoom: 1 };
	if (points.length === 1) return { center: points[0], zoom: 3 };

	let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
	for (const [lon, lat] of points) {
		if (lon < minLon) minLon = lon;
		if (lon > maxLon) maxLon = lon;
		if (lat < minLat) minLat = lat;
		if (lat > maxLat) maxLat = lat;
	}

	const centerLon = (minLon + maxLon) / 2;
	const centerLat = (minLat + maxLat) / 2;

	const spanLon = maxLon - minLon;
	const spanLat = maxLat - minLat;
	const span = Math.max(spanLon, spanLat * 1.8, 20); // account for map aspect ratio

	// Map span to zoom: smaller span = higher zoom
	const zoom = Math.min(Math.max(280 / span, 1), 6);

	return { center: [centerLon, centerLat], zoom };
}

const MapSection = styled(motion.div)`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.md};
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const TitleBar = styled.div`
	width: 3px;
	height: 18px;
	border-radius: 2px;
	background: linear-gradient(
		180deg,
		${({ theme }) => theme.colors.gradientStart},
		${({ theme }) => theme.colors.gradientEnd}
	);
`;

const Title = styled.h2`
	font-size: 18px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};

	@media (max-width: 768px) {
		font-size: 16px;
	}
`;

const MapCard = styled.div`
	background: ${({ theme }) => theme.colors.card};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	padding: ${({ theme }) => theme.spacing.lg};
	box-shadow: ${({ theme }) => theme.colors.shadow};
	overflow: hidden;
	position: relative;

	@media (max-width: 768px) {
		padding: ${({ theme }) => theme.spacing.md};
	}

	@media (max-width: 520px) {
		padding: ${({ theme }) => theme.spacing.sm};
	}
`;

const MapContainer = styled.div`
	width: 100%;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	overflow: hidden;
	position: relative;
	background: ${({ theme }) => theme.colors.bg};
	touch-action: none;

	.rsm-geography {
		outline: none;
		transition: fill 0.3s ease, stroke 0.3s ease;
	}
`;

const Tooltip = styled(motion.div)`
	position: absolute;
	pointer-events: none;
	background: ${({ theme }) => theme.colors.card};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
	font-size: 13px;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
	white-space: nowrap;
	box-shadow: ${({ theme }) => theme.colors.shadowLg};
	z-index: 10;
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.xs};
	transform: translateX(-50%);
`;

const TooltipDot = styled.span<{ $color: string }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $color }) => $color};
	flex-shrink: 0;
`;

const Legend = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: ${({ theme }) => theme.spacing.sm};
	margin-top: ${({ theme }) => theme.spacing.md};
	padding-top: ${({ theme }) => theme.spacing.md};
	border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const LegendItem = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.xs};
	font-size: 12px;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.textSecondary};
`;

const LegendDot = styled.span<{ $color: string }>`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: ${({ $color }) => $color};
	flex-shrink: 0;
`;

interface TooltipData {
	x: number;
	y: number;
	name: string;
	currency: string;
	color: string;
}

interface CurrencyMapProps {
	currencies: string[];
	onAddCurrency?: (code: string) => void;
}

const CurrencyMap = ({ currencies, onAddCurrency }: CurrencyMapProps) => {
	const { t } = useTranslation();
	const [tooltip, setTooltip] = useState<TooltipData | null>(null);

	const countryColorMap = useMemo(() => {
		const map: Record<string, { currency: string; color: string }> = {};
		currencies.forEach((code, i) => {
			const entry = CURRENCY_COUNTRIES[code];
			if (!entry) return;
			const color = PALETTE[i % PALETTE.length];
			entry.countries.forEach((numericCode) => {
				map[numericCode] = { currency: code, color };
			});
		});
		return map;
	}, [currencies]);

	const activeLegend = useMemo(() => {
		return currencies
			.filter((code) => CURRENCY_COUNTRIES[code])
			.map((code, i) => ({
				code,
				color: PALETTE[i % PALETTE.length],
				label: CURRENCY_COUNTRIES[code].label
			}));
	}, [currencies]);

	const focus = useMemo(() => computeFocus(currencies), [currencies]);
	const [mapPos, setMapPos] = useState<{ center: [number, number]; zoom: number }>(focus);
	const prevFocusRef = useRef(focus);

	// Update map position when currencies change (new focus), but allow user to pan/zoom freely
	useEffect(() => {
		if (
			prevFocusRef.current.center[0] !== focus.center[0] ||
			prevFocusRef.current.center[1] !== focus.center[1] ||
			prevFocusRef.current.zoom !== focus.zoom
		) {
			setMapPos(focus);
			prevFocusRef.current = focus;
		}
	}, [focus]);

	return (
		<MapSection
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5, delay: 0.4 }}
		>
			<TitleRow>
				<TitleBar />
				<Title>{t('map.title')}</Title>
			</TitleRow>
			<MapCard>
				<MapContainer>
					<ComposableMap
						projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
						width={800}
						height={400}
						style={{ width: '100%', height: 'auto' }}
					>
						<ZoomableGroup
							center={mapPos.center}
							zoom={mapPos.zoom}
							{...{ onMoveEnd: (p: { coordinates: [number, number]; zoom: number }) => setMapPos({ center: p.coordinates, zoom: p.zoom }) } as Record<string, unknown>}
						>
							<Geographies geography={GEO_URL}>
								{({ geographies }) =>
									geographies.map((geo) => {
										const numericCode = geo.id;
										const info = countryColorMap[numericCode];
										const isHighlighted = !!info;

										const countryCurrency = COUNTRY_TO_CURRENCY[numericCode];

										return (
											<MemoGeography
												key={geo.rsmKey}
												geo={geo}
												isHighlighted={isHighlighted}
												color={info?.color}
												currency={info?.currency}
												countryCurrency={countryCurrency}
												onTooltip={setTooltip}
												onClickCountry={onAddCurrency}
											/>
										);
									})
								}
							</Geographies>
						</ZoomableGroup>
					</ComposableMap>
					<AnimatePresence>
						{tooltip && (
							<Tooltip
								key="tooltip"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								transition={{ duration: 0.15 }}
								style={{ left: tooltip.x, top: tooltip.y }}
							>
								<TooltipDot $color={tooltip.color} />
								{tooltip.name} ({tooltip.currency})
							</Tooltip>
						)}
					</AnimatePresence>
				</MapContainer>
				{activeLegend.length > 0 && (
					<Legend>
						{activeLegend.map((item) => (
							<LegendItem key={item.code}>
								<LegendDot $color={item.color} />
								{item.code} — {item.label}
							</LegendItem>
						))}
					</Legend>
				)}
			</MapCard>
		</MapSection>
	);
};

const MemoGeography = memo(({ geo, isHighlighted, color, currency, countryCurrency, onTooltip, onClickCountry }: {
	geo: { id: string; rsmKey: string; properties: { name: string } };
	isHighlighted: boolean;
	color?: string;
	currency?: string;
	countryCurrency?: string;
	onTooltip: (data: TooltipData | null) => void;
	onClickCountry?: (code: string) => void;
}) => {
	const hasClickAction = !!countryCurrency;

	return (
		<Geography
			geography={geo}
			fill={isHighlighted ? color : '#dde1ec'}
			stroke={isHighlighted ? color : '#bfc5d6'}
			strokeWidth={isHighlighted ? 1 : 0.3}
			style={{
				default: {
					opacity: isHighlighted ? 0.9 : 0.3,
					transition: 'all 0.3s ease'
				},
				hover: {
					opacity: isHighlighted ? 1 : hasClickAction ? 0.5 : 0.4,
					filter: isHighlighted ? 'brightness(1.2)' : 'none',
					cursor: hasClickAction ? 'pointer' : 'default'
				},
				pressed: { opacity: 1 }
			}}
			onClick={() => {
				if (countryCurrency && onClickCountry) {
					onClickCountry(countryCurrency);
				}
			}}
			onMouseEnter={(e) => {
				const showCurrency = currency || countryCurrency;
				if (!showCurrency) return;
				const container = (e.target as SVGElement).closest('.rsm-svg')?.parentElement;
				if (!container) return;
				const rect = container.getBoundingClientRect();
				onTooltip({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top - 40,
					name: geo.properties.name,
					currency: showCurrency,
					color: color || '#94a3b8'
				});
			}}
			onMouseMove={(e) => {
				const showCurrency = currency || countryCurrency;
				if (!showCurrency) return;
				const container = (e.target as SVGElement).closest('.rsm-svg')?.parentElement;
				if (!container) return;
				const rect = container.getBoundingClientRect();
				onTooltip({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top - 40,
					name: geo.properties.name,
					currency: showCurrency,
					color: color || '#94a3b8'
				});
			}}
			onMouseLeave={() => onTooltip(null)}
		/>
	);
});

MemoGeography.displayName = 'MemoGeography';

export default CurrencyMap;
