import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Content-Security-Policy добавляется только в production-сборку:
// в dev-режиме Vite использует inline-скрипты и websocket для HMR.
const CSP = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://azbyka.ru https://*.azbyka.ru https://ispoved.app http://82.146.34.140:3000",
    "form-action 'self'"
].join('; ');

const cspPlugin = {
    name: 'inject-csp',
    transformIndexHtml(html, ctx) {
        if (ctx.server) return html;
        return {
            html,
            tags: [{
                tag: 'meta',
                attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
                injectTo: 'head-prepend'
            }]
        };
    }
};

export default defineConfig(({ command }) => ({
    server: {
        host: true,
        port: 5173,
        hmr: {
            overlay: false
        },
        watch: {
            ignored: [
                '**/android/**',
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**'
            ]
        }
    },
    esbuild: {
        loader: 'js',
        include: /^src\/.*\.js$/,
        exclude: [/node_modules/, /\.agents\//, /my-video\//, /\.jsx$/, /\.tsx$/],
        jsx: 'preserve',
        // В production убираем отладочные логи, но оставляем console.warn/error.
        ...(command === 'build' ? {
            pure: ['console.log', 'console.debug', 'console.info'],
            drop: ['debugger']
        } : {})
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'js'
            }
        }
    },
    plugins: [
        cspPlugin,
        VitePWA({
            strategy: 'generateSW',
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
                name: 'Исповедь',
                short_name: 'Исповедь',
                theme_color: '#fbf9f4',
                background_color: '#fbf9f4',
                display: 'standalone',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '/pwa-maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: '/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any'
                    }
                ]
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/azbyka\.ru\/audio\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'azbyka-audio-cache',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 60
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/azbyka\.ru\/days\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'azbyka-api-cache',
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 60,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ]
}));
