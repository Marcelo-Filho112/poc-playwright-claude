import { test, expect } from '@playwright/test';

/**
 * Teste de fluxo autenticado.
 *
 * Herda automaticamente a sessao salva em .auth/user.json (configurado no
 * projeto "chromium" do playwright.config.ts, que depende do projeto "setup").
 * Ou seja: ao chegar aqui, a pagina ja esta logada.
 *
 * Ajuste rotas e locators para a sua app.
 */
test('usuario logado acessa o dashboard', async ({ page }) => {
  await page.goto('/dashboard');

  // Algo que so aparece para usuarios autenticados (ex.: nome no header).
  await expect(
    page.getByRole('banner').or(page.getByRole('heading')).first(),
  ).toBeVisible();
});

test('acao protegida esta disponivel', async ({ page }) => {
  await page.goto('/dashboard');

  // Exemplo do video: confirmar um botao de acao visivel para o usuario logado.
  const acao = page.getByRole('button', { name: /criar|novo|new|create/i }).first();
  await expect(acao).toBeVisible();
});
