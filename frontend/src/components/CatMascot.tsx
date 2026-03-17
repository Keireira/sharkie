'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
	0%, 100% { transform: translateY(0px); }
	50% { transform: translateY(-8px); }
`;

const tailWag = keyframes`
	0%, 100% { transform: rotate(-15deg) translateX(-2px); }
	50% { transform: rotate(15deg) translateX(2px); }
`;

const blink = keyframes`
	0%, 92%, 100% { transform: scaleY(1); }
	96% { transform: scaleY(0.1); }
`;

const purr = keyframes`
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.03); }
`;

const CatContainer = styled.div<{ $dragging?: boolean }>`
	position: fixed;
	z-index: 1000;
	cursor: ${({ $dragging }) => ($dragging ? 'grabbing' : 'pointer')};
	animation: ${({ $dragging }) => ($dragging ? 'none' : float)} 3s ease-in-out infinite;
	touch-action: none;
	user-select: none;

	@media (max-width: 768px) {
		transform: scale(0.8);
	}
`;

const CatBody = styled.div<{ $mood: string }>`
	position: relative;
	width: 60px;
	height: 50px;
	background: ${({ theme }) => theme.colors.catPrimary};
	border-radius: 50% 50% 45% 45%;
	animation: ${({ $mood }) => ($mood === 'loading' ? purr : 'none')} 1s ease-in-out infinite;
	box-shadow: 0 4px 20px ${({ theme }) => theme.colors.shadow};
`;

const Ear = styled.div<{ $side: 'left' | 'right' }>`
	position: absolute;
	top: -10px;
	${({ $side }) => ($side === 'left' ? 'left: 6px;' : 'right: 6px;')}
	width: 0;
	height: 0;
	border-left: 10px solid transparent;
	border-right: 10px solid transparent;
	border-bottom: 14px solid ${({ theme }) => theme.colors.catPrimary};
	transform: ${({ $side }) => ($side === 'left' ? 'rotate(-10deg)' : 'rotate(10deg)')};

	&::after {
		content: '';
		position: absolute;
		top: 4px;
		left: -6px;
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-bottom: 9px solid ${({ theme }) => theme.colors.catSecondary};
	}
`;

const Eye = styled.div<{ $side: 'left' | 'right'; $mood: string }>`
	position: absolute;
	top: 14px;
	${({ $side }) => ($side === 'left' ? 'left: 14px;' : 'right: 14px;')}
	width: ${({ $mood }) => ($mood === 'error' ? '10px' : '8px')};
	height: ${({ $mood }) => ($mood === 'idle' ? '3px' : '8px')};
	background: ${({ $mood }) => ($mood === 'error' ? '#ef4444' : '#1a1a2e')};
	border-radius: ${({ $mood }) => ($mood === 'idle' ? '50%' : '50%')};
	animation: ${({ $mood }) => ($mood === 'idle' ? 'none' : blink)} 4s ease-in-out infinite;
	animation-delay: ${({ $side }) => ($side === 'right' ? '0.1s' : '0s')};
`;

const Nose = styled.div`
	position: absolute;
	top: 22px;
	left: 50%;
	transform: translateX(-50%);
	width: 6px;
	height: 4px;
	background: ${({ theme }) => theme.colors.catSecondary};
	border-radius: 50%;
`;

const Mouth = styled.div<{ $mood: string }>`
	position: absolute;
	top: 26px;
	left: 50%;
	transform: translateX(-50%);
	width: 12px;
	height: ${({ $mood }) => ($mood === 'success' ? '6px' : '2px')};
	border-bottom: 2px solid #1a1a2e;
	border-radius: ${({ $mood }) => ($mood === 'success' ? '0 0 50% 50%' : '0')};
`;

const Tail = styled.div`
	position: absolute;
	bottom: 8px;
	right: -12px;
	width: 20px;
	height: 6px;
	background: ${({ theme }) => theme.colors.catPrimary};
	border-radius: 0 8px 8px 0;
	transform-origin: left center;
	animation: ${tailWag} 1.5s ease-in-out infinite;
`;

const SpeechBubble = styled(motion.div)`
	position: absolute;
	bottom: 65px;
	right: 0;
	min-width: 140px;
	max-width: 180px;
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
	background: ${({ theme }) => theme.colors.card};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 12px;
	color: ${({ theme }) => theme.colors.text};
	box-shadow: 0 4px 16px ${({ theme }) => theme.colors.shadow};
	line-height: 1.4;

	&::after {
		content: '';
		position: absolute;
		bottom: -6px;
		right: 20px;
		width: 12px;
		height: 12px;
		background: ${({ theme }) => theme.colors.card};
		border-right: 1px solid ${({ theme }) => theme.colors.border};
		border-bottom: 1px solid ${({ theme }) => theme.colors.border};
		transform: rotate(45deg);
	}
`;

const _CalcBadge = styled.div<{ $open?: boolean }>`
	position: absolute;
	bottom: -16px;
	left: 50%;
	transform: translateX(-50%);
	font-size: 14px;
	line-height: 1;
	white-space: nowrap;
	background: ${({ $open, theme }) => ($open ? theme.colors.danger : theme.colors.accent)};
	color: #fff;
	padding: 3px 8px;
	border-radius: 10px;
	box-shadow: 0 2px 8px ${({ theme }) => theme.colors.shadow};
	transition: background 0.2s;
`;

export type CatMood = 'greeting' | 'loading' | 'success' | 'error' | 'idle';

/** Standalone cat face for embedding (e.g. in calculator header) */
export const CatFace = ({ mood = 'idle', scale = 1 }: { mood?: CatMood; scale?: number }) => (
	<div style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom', display: 'inline-block' }}>
		<CatBody $mood={mood} style={{ boxShadow: 'none' }}>
			<Ear $side="left" />
			<Ear $side="right" />
			<Eye $side="left" $mood={mood} />
			<Eye $side="right" $mood={mood} />
			<Nose />
			<Mouth $mood={mood} />
			<Tail />
		</CatBody>
	</div>
);

interface CatMascotProps {
	mood?: CatMood;
	onCalcToggle?: () => void;
	calcOpen?: boolean;
	onPositionChange?: (pos: { xPct: number; yPct: number } | null) => void;
}

const STORAGE_KEY = 'sharkie-cat-pos';

function loadCatPos(): { x: number; y: number } | null {
	if (typeof window === 'undefined') return null;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) return JSON.parse(saved);
	} catch {
		/* ignore */
	}
	return null;
}

const CatMascot = ({ mood = 'idle', onCalcToggle, calcOpen, onPositionChange }: CatMascotProps) => {
	const { t } = useTranslation();
	const [showBubble, setShowBubble] = useState(false);
	const [posPercent, setPosPercent] = useState<{ x: number; y: number } | null>(loadCatPos);
	const [dragging, setDragging] = useState(false);
	const didDrag = useRef(false);
	const dragOffset = useRef({ x: 0, y: 0 });

	useEffect(() => {
		if (mood !== 'idle') {
			setShowBubble(true);
			const timer = setTimeout(() => setShowBubble(false), 4000);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [mood]);

	// Persist position and notify parent
	useEffect(() => {
		if (posPercent) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(posPercent));
			} catch {
				/* ignore */
			}
		}
		onPositionChange?.(posPercent ? { xPct: posPercent.x, yPct: posPercent.y } : null);
	}, [posPercent, onPositionChange]);

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		const el = e.currentTarget as HTMLElement;
		el.setPointerCapture(e.pointerId);
		const rect = el.getBoundingClientRect();
		dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
		didDrag.current = false;
		setDragging(true);
	}, []);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!dragging) return;
			didDrag.current = true;
			const vw = window.innerWidth || 1;
			const vh = window.innerHeight || 1;
			const catW = 60;
			const catH = 65;
			const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, vw - catW));
			const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, vh - catH));
			setPosPercent({ x: (newX / vw) * 100, y: (newY / vh) * 100 });
		},
		[dragging]
	);

	const handlePointerUp = useCallback(() => {
		setDragging(false);
	}, []);

	const handleClick = () => {
		if (didDrag.current) return;
		if (onCalcToggle) {
			onCalcToggle();
		} else {
			setShowBubble((v) => !v);
		}
	};

	const message = calcOpen ? t('cat.tip') : t(`cat.${mood}`);

	const posStyle: React.CSSProperties = posPercent
		? { left: `${posPercent.x}vw`, top: `${posPercent.y}vh`, right: 'auto', bottom: 'auto' }
		: { bottom: 24, right: 24 };

	return (
		<CatContainer
			$dragging={dragging}
			style={posStyle}
			onClick={handleClick}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			<AnimatePresence>
				{showBubble && !calcOpen && (
					<SpeechBubble
						initial={{ opacity: 0, y: 10, scale: 0.8 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.8 }}
						transition={{ duration: 0.3 }}
					>
						{message}
					</SpeechBubble>
				)}
			</AnimatePresence>
			<CatBody $mood={calcOpen ? 'success' : mood}>
				<Ear $side="left" />
				<Ear $side="right" />
				<Eye $side="left" $mood={calcOpen ? 'success' : mood} />
				<Eye $side="right" $mood={calcOpen ? 'success' : mood} />
				<Nose />
				<Mouth $mood={calcOpen ? 'success' : mood} />
				<Tail />
			</CatBody>
		</CatContainer>
	);
};

export default CatMascot;
