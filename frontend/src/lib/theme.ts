export type AppTheme = {
	name: string;
	colors: {
		bg: string;
		bgSecondary: string;
		card: string;
		cardHover: string;
		border: string;
		borderHover: string;
		text: string;
		textSecondary: string;
		textMuted: string;
		accent: string;
		accentLight: string;
		accentGlow: string;
		success: string;
		danger: string;
		warning: string;
		shadow: string;
		shadowSm: string;
		shadowLg: string;
		glass: string;
		glassBorder: string;
		chartGrid: string;
		catPrimary: string;
		catSecondary: string;
		gradientStart: string;
		gradientEnd: string;
	};
	borderRadius: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
		full: string;
	};
	spacing: {
		xs: string;
		sm: string;
		md: string;
		lg: string;
		xl: string;
		xxl: string;
	};
};

export const darkTheme: AppTheme = {
	name: 'dark',
	colors: {
		bg: '#111111',
		bgSecondary: '#1A1A1A',
		card: '#1E1E1E',
		cardHover: '#252525',
		border: 'rgba(255, 255, 255, 0.08)',
		borderHover: 'rgba(202, 255, 51, 0.3)',
		text: '#F5F5F5',
		textSecondary: '#A0A0A0',
		textMuted: '#606060',
		accent: '#CAFF33',
		accentLight: '#D4FF5C',
		accentGlow: 'rgba(202, 255, 51, 0.15)',
		success: '#4ADE80',
		danger: '#F87171',
		warning: '#FBBF24',
		shadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3)',
		shadowSm: '0 2px 8px rgba(0, 0, 0, 0.4)',
		shadowLg: '0 16px 48px rgba(0, 0, 0, 0.6), 0 6px 20px rgba(0, 0, 0, 0.35)',
		glass: 'rgba(30, 30, 30, 0.85)',
		glassBorder: 'rgba(255, 255, 255, 0.06)',
		chartGrid: 'rgba(255, 255, 255, 0.06)',
		catPrimary: '#CAFF33',
		catSecondary: '#A3D925',
		gradientStart: '#CAFF33',
		gradientEnd: '#7CDB24'
	},
	borderRadius: {
		sm: '8px',
		md: '14px',
		lg: '20px',
		xl: '28px',
		full: '9999px'
	},
	spacing: {
		xs: '4px',
		sm: '8px',
		md: '16px',
		lg: '24px',
		xl: '32px',
		xxl: '48px'
	}
};

export const lightTheme: AppTheme = {
	name: 'light',
	colors: {
		bg: '#FFFAF5',
		bgSecondary: '#FFF0F0',
		card: '#FFFFFF',
		cardHover: '#FFF8F2',
		border: 'rgba(0, 77, 255, 0.15)',
		borderHover: 'rgba(228, 3, 3, 0.35)',
		text: '#1B1464',
		textSecondary: '#4A3D8F',
		textMuted: '#8B80B8',
		accent: '#E40303',
		accentLight: '#FF4040',
		accentGlow: 'rgba(228, 3, 3, 0.1)',
		success: '#008026',
		danger: '#E40303',
		warning: '#FF8C00',
		shadow: '0 4px 20px rgba(0, 77, 255, 0.06), 0 1px 3px rgba(228, 3, 3, 0.04)',
		shadowSm: '0 1px 3px rgba(117, 7, 135, 0.06)',
		shadowLg: '0 16px 48px rgba(0, 77, 255, 0.08), 0 6px 18px rgba(228, 3, 3, 0.05)',
		glass: 'rgba(255, 252, 248, 0.9)',
		glassBorder: 'rgba(0, 77, 255, 0.12)',
		chartGrid: 'rgba(0, 77, 255, 0.06)',
		catPrimary: '#FFAFC8',
		catSecondary: '#73D7EE',
		gradientStart: '#E40303',
		gradientEnd: '#004DFF'
	},
	borderRadius: darkTheme.borderRadius,
	spacing: darkTheme.spacing
};
