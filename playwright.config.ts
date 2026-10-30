import { defineConfig, devices } from '@playwright/test';
try {
  process.loadEnvFile('.env.local');
} catch {
  /* Pruebas de acceso disponibles sin Supabase. */
}
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    locale: 'es-CO',
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: {
      ...(chromiumExecutable ? { executablePath: chromiumExecutable } : {}),
      args: ['--no-sandbox'],
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
});
