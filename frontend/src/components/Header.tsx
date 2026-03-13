'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '@/providers/Providers';
import { useHealthQuery } from '@/hooks/useRates';

const HeaderBar = styled.header`
	position: sticky;
	top: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 56px;
	padding: 0 ${({ theme }) => theme.spacing.lg};
	background: ${({ theme }) => theme.colors.card};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	box-shadow: ${({ theme }) => theme.colors.shadowSm};

	@media (max-width: 768px) {
		height: 48px;
		padding: 0 ${({ theme }) => theme.spacing.md};
	}
`;

const Left = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.md};
`;

const Logo = styled.span`
	font-size: 20px;
	font-weight: 800;
	letter-spacing: -0.03em;
	background: linear-gradient(135deg, ${({ theme }) => theme.colors.gradientStart}, ${({ theme }) => theme.colors.gradientEnd});
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;

	@media (max-width: 768px) {
		font-size: 18px;
	}
`;

const Subtitle = styled.span`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.textMuted};
	font-weight: 500;

	@media (max-width: 640px) {
		display: none;
	}
`;

const Right = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const HealthDot = styled.div<{ $online: boolean }>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${({ $online, theme }) => ($online ? theme.colors.success : theme.colors.danger)};
	box-shadow: 0 0 6px ${({ $online, theme }) => ($online ? theme.colors.success : theme.colors.danger)};
	margin-right: ${({ theme }) => theme.spacing.xs};
`;

const ToggleButton = styled(motion.button)`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 32px;
	padding: 0 12px;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	background: ${({ theme }) => theme.colors.bgSecondary};
	color: ${({ theme }) => theme.colors.textSecondary};
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	transition: all 0.2s ease;
	gap: 6px;

	&:hover {
		border-color: ${({ theme }) => theme.colors.borderHover};
		color: ${({ theme }) => theme.colors.text};
	}
`;

const ThemeIcon = styled.span`
	font-size: 14px;
	line-height: 1;
`;

const Header = () => {
	const { t } = useTranslation();
	const { settings, setSettings } = useAppSettings();
	const { data: health } = useHealthQuery();

	const toggleTheme = () => {
		setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
	};

	const toggleLang = () => {
		setSettings({ language: settings.language === 'en' ? 'ru' : 'en' });
	};

	return (
		<HeaderBar>
			<Left>
				<Logo>Sharkie</Logo>
				<Subtitle>{t('subtitle')}</Subtitle>
			</Left>
			<Right>
				<HealthDot
					$online={health?.status === 'ok'}
					title={health?.status === 'ok' ? t('health.online') : t('health.offline')}
				/>
				<ToggleButton onClick={toggleTheme} whileTap={{ scale: 0.95 }}>
					<ThemeIcon>&#x25D0;</ThemeIcon>
				</ToggleButton>
				<ToggleButton onClick={toggleLang} whileTap={{ scale: 0.95 }}>
					{settings.language === 'en' ? 'RU' : 'EN'}
				</ToggleButton>
			</Right>
		</HeaderBar>
	);
};

export default Header;
