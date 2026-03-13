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
		// Backgrounds - warm off-white
		bg: '#F8F9FA',
		bgSecondary: '#EDF0F3',
		// Cards - pure white with subtle warmth
		card: '#FFFFFF',
		cardHover: '#F5F7FA',
		// Borders - soft neutral
		border: 'rgba(0, 0, 0, 0.07)',
		borderHover: 'rgba(59, 130, 246, 0.3)',
		// Text - rich dark hierarchy
		text: '#0F172A',
		textSecondary: '#475569',
		textMuted: '#94A3B8',
		// Accent - modern blue
		accent: '#2563EB',
		accentLight: '#3B82F6',
		accentGlow: 'rgba(37, 99, 235, 0.08)',
		// Status colors
		success: '#059669',
		danger: '#DC2626',
		warning: '#D97706',
		// Shadows - soft and layered
		shadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
		shadowSm: '0 1px 3px rgba(0, 0, 0, 0.05)',
		shadowLg: '0 16px 48px rgba(0, 0, 0, 0.1), 0 6px 18px rgba(0, 0, 0, 0.05)',
		// Glass - frosted white
		glass: 'rgba(255, 255, 255, 0.8)',
		glassBorder: 'rgba(0, 0, 0, 0.04)',
		// Chart
		chartGrid: 'rgba(0, 0, 0, 0.05)',
		// Cat accents - blue
		catPrimary: '#2563EB',
		catSecondary: '#1D4ED8',
		// Gradients - blue to indigo
		gradientStart: '#3B82F6',
		gradientEnd: '#6366F1'
	},
	borderRadius: darkTheme.borderRadius,
	spacing: darkTheme.spacing
};

export type AppTheme = Omit<typeof darkTheme, 'name'> & { name: string };
