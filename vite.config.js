import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
        jsx: 'preserve'
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'js'
            }
        }
    },
    plugins: [
        VitePWA({
            strategy: 'generateSW',
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
                name: 'Исповедь',
                short_name: 'Исповедь',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: '/icon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
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
                        urlPattern: /^https:\/\/pravoslavie-audio\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'pravoslavie-audio-cache',
                            expiration: {
                                maxEntries: 20,
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
});
