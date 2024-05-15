import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from 'vite-plugin-html'
import viteCompression from 'vite-plugin-compression'

const { default: stdLibBrowser } = await import('node-stdlib-browser');

export default defineConfig({
    resolve: {
        alias: stdLibBrowser,
    },
    optimizeDeps: { // 👈 optimizedeps
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis'
            },
            supported: {
                bigint: true
            },
        },
        include: ['buffer', 'process'],
    },
    build: {
        target: ["esnext"], // 👈 build.target
        rollupOptions: {
            onwarn(warning, warn) {
                if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
                    return;
                }
                warn(warning);
            },
            output: {
                manualChunks: (id: string) => {
                    if (id.includes('node_modules/') && !id.includes('soltrain-')) {
                        return 'vendors';
                    }
                }
            }
        },
    },
    plugins: [
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
        VitePWA({}),
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
    ],
})
