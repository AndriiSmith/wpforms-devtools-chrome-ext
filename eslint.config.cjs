const js = require('@eslint/js');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

module.exports = [
	js.configs.recommended,
	{
		files: ['**/*.{js,jsx,mjs,cjs}'],
		ignores: [
			'extension/**',
			'node_modules/**',
			'dist/**',
			'build/**',
			'webpack.config.js',
			'*/**/*.min.js'
		],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					jsx: true
				}
			},
			globals: {
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				location: 'readonly',
				history: 'readonly',
				localStorage: 'readonly',
				sessionStorage: 'readonly',
				console: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				
				// Chrome Extension APIs
				chrome: 'readonly',
				browser: 'readonly',

				// Chrome DevTools specific
				InspectorFrontendHost: 'readonly',
				WebInspector: 'readonly',
				Protocol: 'readonly',
				SDK: 'readonly',
				UI: 'readonly',
				Host: 'readonly',
				
				// Development helpers
				process: 'readonly',
				__dirname: 'readonly',
				module: 'readonly',
				require: 'readonly'
			}
		},
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooksPlugin
		},
		settings: {
			react: {
				version: 'detect'
			}
		},
		rules: {
			'react/prop-types': 'off',
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			
			// Common extension-specific rules
			'no-undef': 'error',
			'no-unused-vars': 'warn',
			'no-console': 'off', // Allow console for debugging
			'camelcase': 'warn'
		}
	}
];
