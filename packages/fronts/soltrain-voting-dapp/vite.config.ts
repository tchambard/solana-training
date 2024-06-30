import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';
import { createHtmlPlugin } from 'vite-plugin-html';
import viteCompression from 'vite-plugin-compression';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import * as path from 'path';
import checker from 'vite-plugin-checker';

const { default: stdLibBrowser } = await import('node-stdlib-browser');

export default defineConfig({
	resolve: {
		alias: {
			...stdLibBrowser,
			'@voting-idl': path.resolve(
				'../../programs/soltrain-voting-program/target/idl/voting.json',
			),
			'@voting': path.resolve('../../programs/soltrain-voting-program/client'),
		},
	},
	optimizeDeps: {
		// 👈 optimizedeps
		esbuildOptions: {
			// Node.js global to browser globalThis
			define: {
				global: 'globalThis',
			},
			supported: {
				bigint: true,
			},
		},
		include: ['buffer', 'process', '@solana/web3.js', '@coral-xyz/anchor'],
	},
	build: {
		chunkSizeWarningLimit: 1000,
		target: ['esnext'], // 👈 build.target
		rollupOptions: {
			onwarn(warning, warn) {
				if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
					return;
				}
				warn(warning);
			},
		},
	},
	plugins: [
		checker({
			typescript: true,
		}),
		react({
			jsxImportSource: '@emotion/react',
			babel: {
				plugins: [
					'@emotion/babel-plugin',
					[
						'babel-plugin-import',
						{
							libraryName: '@mui/material',
							libraryDirectory: '',
							camel2DashComponentName: false,
						},
						'core',
					],
					[
						'babel-plugin-import',
						{
							libraryName: '@mui/icons-material',
							libraryDirectory: '',
							camel2DashComponentName: false,
						},
						'icons',
					],
				],
			},
		}),
		tsconfigPaths(),
		VitePWA({
			manifest: {
				name: 'Solana voting dApp',
				short_name: 'Solana voting dApp',
				icons: [
					{
						src: '/android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
			},
		}),
		createHtmlPlugin({
			minify: true,
			inject: {
				data: {
					title: 'Solana voting dapp',
					domain: 'localhost',
					themeColor: '#ffffff',
				},
			},
		}),
		viteCompression(),
		splitVendorChunkPlugin(),
		nodePolyfills({
			include: ['process'],
		}),
	],
});
