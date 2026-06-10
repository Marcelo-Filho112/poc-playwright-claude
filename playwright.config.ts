import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * baseURL e parametrizavel por env (.env). Default aponta para uma app local.
 * Troque BASE_URL para rodar contra outro ambiente (ex.: um site demo publico).
 */
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 1. Projeto de setup: faz login uma vez e salva o storage state.
    {
      name: 'setup',
      testMatch: /auth\/.*\.setup\.ts/,
    },

    // 2. Testes autenticados: reutilizam a sessao gerada pelo setup.
    //    (tudo em tests/, exceto tests/public/)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /tests\/(?!public\/).*\.spec\.ts/,
    },

    // 3. Testes publicos: SEM login e SEM depender do setup de auth.
    //    Ideal para explorar sites externos (ex.: amazon). Rode so este projeto com:
    //    npm test -- --project=public
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /tests\/public\/.*\.spec\.ts/,
    },
  ],
});
