import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

/**
 * Authentication setup project (padrao oficial do Playwright).
 *
 * Faz login UMA vez e salva o estado da sessao (cookies + localStorage) em
 * .auth/user.json. Os specs em tests/ reutilizam esse arquivo via storageState,
 * evitando relogar a cada teste.
 *
 * Regenerar a sessao:  npm run auth
 *
 * Ajuste os locators abaixo para a sua app. Use o Claude Code + Playwright CLI
 * para descobrir os locators reais (veja docs/prompts.md).
 */
const authFile = path.join(process.cwd(), '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  const user = process.env.TEST_USER;
  const pass = process.env.TEST_PASS;

  if (!user || !pass) {
    throw new Error(
      'Defina TEST_USER e TEST_PASS no .env (copie de .env.example) antes de rodar o setup de auth.',
    );
  }

  // 1. Abre a tela de login. Ajuste a rota conforme a sua app.
  await page.goto('/login');

  // 2. Preenche credenciais. Prefira locators por role/label (resilientes).
  await page.getByLabel(/e-?mail|usuario|username/i).fill(user);
  await page.getByLabel(/senha|password/i).fill(pass);
  await page.getByRole('button', { name: /entrar|login|sign in/i }).click();

  // 3. Confirma que o login funcionou antes de salvar o estado.
  //    Ajuste a assercao para algo que so aparece logado (ex.: header com nome).
  await expect(page).toHaveURL(/dashboard|home|\/$/);

  // 4. Persiste a sessao em disco.
  await page.context().storageState({ path: authFile });
});
