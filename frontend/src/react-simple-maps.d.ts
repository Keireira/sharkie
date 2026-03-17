declare module 'react-simple-maps' {
	import type { ComponentType, ReactNode, CSSProperties } from 'react';

	interface ProjectionConfig {
		rotate?: [number, number, number];
		scale?: number;
		center?: [number, number];
	}

	interface ComposableMapProps {
		projectionConfig?: ProjectionConfig;
		width?: number;
		height?: number;
		style?: CSSProperties;
		children?: ReactNode;
	}

	interface ZoomableGroupProps {
		center?: [number, number];
		zoom?: number;
		children?: ReactNode;
	}

	interface GeographiesProps {
		geography: string | object;
		children: (data: { geographies: Array<{ id: string; rsmKey: string; properties: { name: string } }> }) => ReactNode;
	}

	interface GeographyStyleState {
		opacity?: number;
		transition?: string;
		filter?: string;
		cursor?: string;
	}

	interface GeographyProps {
		geography: unknown;
		fill?: string;
		stroke?: string;
		strokeWidth?: number;
		style?: {
			default?: GeographyStyleState;
			hover?: GeographyStyleState;
			pressed?: GeographyStyleState;
		};
		onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
		onMouseMove?: (event: React.MouseEvent<SVGPathElement>) => void;
		onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void;
		onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
	}

	export const ComposableMap: ComponentType<ComposableMapProps>;
	export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
	export const Geographies: ComponentType<GeographiesProps>;
	export const Geography: ComponentType<GeographyProps>;
}
