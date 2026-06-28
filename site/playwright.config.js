// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173',
        trace: 'on-first-retry',
        actionTimeout: 15000,
        navigationTimeout: 20000,
    },
    projects: [
        {
            name: 'desktop',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 800 },
            },
        },
        {
            name: 'iphone',
            use: {
                ...devices['iPhone 14'],
                // viewport: 390×844, userAgent iPhone Safari
            },
        },
        {
            name: 'ipad',
            use: {
                ...devices['iPad Pro'],
                // viewport: 1024×1366, userAgent iPad Safari
            },
        },
    ],
    // Start vite preview before tests in CI
    // webServer: {
    //   command: 'npm run preview',
    //   url: 'http://localhost:4173',
    //   reuseExistingServer: !process.env.CI,
    // },
});
