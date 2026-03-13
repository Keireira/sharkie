export const darkTheme = {
	name: 'dark' as const,
	colors: {
		// Backgrounds - very dark, near-black
		bg: '#111111',
		bgSecondary: '#1A1A1A',
		// Cards - subtle elevation from background
		card: '#1E1E1E',
		cardHover: '#252525',
		// Borders - faint white, lime on hover
		border: 'rgba(255, 255, 255, 0.08)',
		borderHover: 'rgba(202, 255, 51, 0.3)',
		// Text - clean white hierarchy
		text: '#F5F5F5',
		textSecondary: '#A0A0A0',
		textMuted: '#606060',
		// Accent - lime/yellow-green
		accent: '#CAFF33',
		accentLight: '#D4FF5C',
		accentGlow: 'rgba(202, 255, 51, 0.15)',
		// Status colors
		success: '#4ADE80',
		danger: '#F87171',
		warning: '#FBBF24',
		// Shadows - deep layered
		shadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3)',
		shadowSm: '0 2px 8px rgba(0, 0, 0, 0.4)',
		shadowLg: '0 16px 48px rgba(0, 0, 0, 0.6), 0 6px 20px rgba(0, 0, 0, 0.35)',
		// Glass - dark translucency
		glass: 'rgba(30, 30, 30, 0.85)',
		glassBorder: 'rgba(255, 255, 255, 0.06)',
		// Chart
		chartGrid: 'rgba(255, 255, 255, 0.06)',
		// Cat accents - lime
		catPrimary: '#CAFF33',
		catSecondary: '#A3D925',
		// Gradients - lime to green
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
		// Backgrounds - warm rainbow-white (soft yellow → pink gradient feel)
		bg: '#FFFAF5',
		bgSecondary: '#FFF0F0',
		// Cards - clean white, warm hover
		card: '#FFFFFF',
		cardHover: '#FFF8F2',
		// Borders - rainbow: blue tint default, red-orange on hover
		border: 'rgba(0, 77, 255, 0.15)',
		borderHover: 'rgba(228, 3, 3, 0.35)',
		// Text - deep blue-black (from flag blue)
		text: '#1B1464',
		textSecondary: '#4A3D8F',
		textMuted: '#8B80B8',
		// Accent - flag red (primary rainbow color)
		accent: '#E40303',
		accentLight: '#FF4040',
		accentGlow: 'rgba(228, 3, 3, 0.1)',
		// Status - flag colors
		success: '#008026',
		danger: '#E40303',
		warning: '#FF8C00',
		// Shadows - multi-tinted (blue + pink)
		shadow: '0 4px 20px rgba(0, 77, 255, 0.06), 0 1px 3px rgba(228, 3, 3, 0.04)',
		shadowSm: '0 1px 3px rgba(117, 7, 135, 0.06)',
		shadowLg: '0 16px 48px rgba(0, 77, 255, 0.08), 0 6px 18px rgba(228, 3, 3, 0.05)',
		// Glass - frosted warm white
		glass: 'rgba(255, 252, 248, 0.9)',
		glassBorder: 'rgba(0, 77, 255, 0.12)',
		// Chart
		chartGrid: 'rgba(0, 77, 255, 0.06)',
		// Cat - trans flag colors
		catPrimary: '#FFAFC8',
		catSecondary: '#73D7EE',
		// Gradient - full rainbow: red → blue
		gradientStart: '#E40303',
		gradientEnd: '#004DFF'
	},
	borderRadius: darkTheme.borderRadius,
	spacing: darkTheme.spacing
};

export type AppTheme = Omit<typeof darkTheme, 'name'> & { name: string };
