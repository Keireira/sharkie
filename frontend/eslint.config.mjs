import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname
});

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	...compat.extends('next/core-web-vitals'),
	prettierConfig,
	{
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		ignores: ['.next/', 'node_modules/', 'public/']
	}
);
