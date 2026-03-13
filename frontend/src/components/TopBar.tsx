'use client';

import React from 'react';
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

	@media (max-width: 768px) {
		display: block;
	}
`;

const TopBar = () => {
	const { setSidebarOpen } = useAppSettings();

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
		</Bar>
	);
};

export default TopBar;
