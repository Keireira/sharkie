'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

const ApiReference = () => (
	<ApiReferenceReact
		configuration={{
			url: '/openapi.json',
			theme: 'kepler',
			hideDownloadButton: false,
			serverSelection: 'dropdown'
		}}
	/>
);

export default ApiReference;
