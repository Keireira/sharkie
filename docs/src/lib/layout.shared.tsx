import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
	user: 'Keireira',
	repo: 'sharkie',
	branch: 'master'
};

export const baseOptions = (): BaseLayoutProps => ({
	nav: {
		title: 'Sharkie'
	},
	links: [
		{
			text: 'OpenAPI Reference',
			url: '/api-reference'
		}
	],
	githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`
});

