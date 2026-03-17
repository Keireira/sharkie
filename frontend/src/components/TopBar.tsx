'use client';

import styled from 'styled-components';
import { useAppSettings } from '@/providers/Providers';

const Bar = styled.header`
	position: fixed;
	top: 0;
	right: 0;
	left: 260px;
	z-index: 90;
	display: flex;
	align-items: center;
	height: 0;
	pointer-events: none;

	@media (max-width: 768px) {
		left: 0;
		height: 48px;
		padding: 0 ${({ theme }) => theme.spacing.md};
		background: ${({ theme }) => theme.colors.bg};
		border-bottom: 1px solid ${({ theme }) => theme.colors.border};
		pointer-events: auto;
	}
`;

const HamburgerButton = styled.button`
	display: none;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	padding: 0;
	border: none;
	border-radius: 10px;
	background: transparent;
	color: ${({ theme }) => theme.colors.text};
	cursor: pointer;
	flex-shrink: 0;

	&:hover {
		background: ${({ theme }) => theme.colors.bgSecondary};
	}

	@media (max-width: 768px) {
		display: flex;
	}
`;

const HamburgerIcon = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 5px;
	width: 20px;
	height: 20px;

	span {
		display: block;
		width: 18px;
		height: 2px;
		border-radius: 1px;
		background: ${({ theme }) => theme.colors.text};
	}
`;

const MobileTitle = styled.span`
	display: none;
	font-size: 16px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	margin-left: 12px;
	flex: 1;

	@media (max-width: 768px) {
		display: block;
	}
`;

const ViewToggleBtn = styled.button<{ $active?: boolean }>`
	display: none;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 10px;
	background: ${({ $active, theme }) => ($active ? theme.colors.accentGlow : 'transparent')};
	color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textMuted)};
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

	@media (max-width: 768px) {
		display: flex;
	}
`;

const TopBar = () => {
	const { setSidebarOpen, viewMode, setViewMode } = useAppSettings();

	const toggleView = () => setViewMode(viewMode === 'dashboard' ? 'calculator' : 'dashboard');

	return (
		<Bar>
			<HamburgerButton onClick={() => setSidebarOpen(true)} aria-label="Open menu">
				<HamburgerIcon>
					<span />
					<span />
					<span />
				</HamburgerIcon>
			</HamburgerButton>
			<MobileTitle>Sharkie</MobileTitle>
			<ViewToggleBtn $active={viewMode === 'dashboard'} onClick={toggleView} aria-label="Toggle view">
				{viewMode === 'calculator' ? (
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
						<line x1="1" y1="10" x2="23" y2="10" />
					</svg>
				) : (
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect x="4" y="2" width="16" height="20" rx="2" />
						<line x1="8" y1="6" x2="16" y2="6" />
						<line x1="8" y1="10" x2="16" y2="10" />
					</svg>
				)}
			</ViewToggleBtn>
		</Bar>
	);
};

export default TopBar;
