import { test, expect } from '@playwright/test';

/**
 * Casos de teste GERADOS a partir da exploracao real de https://www.amazon.com.br/
 * (rode `npm run explore -- https://www.amazon.com.br/` para regenerar a observacao).
 *
 * Os locators abaixo vieram da ARIA snapshot capturada — nao foram chutados:
 *   - searchbox: "Pesquisar Amazon.com.br"
 *   - links de navegacao: "Mais Vendidos", "Ofertas do Dia", ...
 *
 * Projeto: "public" (sem login).  Rode so estes:  npm test -- --project=public
 *
 * OBS: a Amazon usa anti-bot; em headless pode aparecer captcha/interstitial e o teste
 * pode ficar instavel. Isso e esperado e e uma boa licao do workflow — para QA serio,
 * prefira o ambiente da sua propria app. Veja a nota no final.
 */
test.describe('Amazon.com.br - home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.amazon.com.br/', { waitUntil: 'domcontentloaded' });
  });

  test('home carrega com titulo e campo de busca', async ({ page }) => {
    await expect(page).toHaveTitle(/Amazon\.com\.br/);
    await expect(page.getByRole('searchbox', { name: /Pesquisar/i })).toBeVisible();
  });

  test('navegacao principal exibe atalhos conhecidos', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Mais Vendidos' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ofertas do Dia' })).toBeVisible();
  });

  test('busca por um termo leva a pagina de resultados', async ({ page }) => {
    const busca = page.getByRole('searchbox', { name: /Pesquisar/i });
    await busca.fill('teclado mecanico');
    await busca.press('Enter');

    // Apos buscar, a URL passa a conter o parametro de busca (?k= / s?k=).
    await expect(page).toHaveURL(/[?&]k=teclado/i);
    // E ha um cabecalho de resultados.
    await expect(page.getByRole('searchbox', { name: /Pesquisar/i })).toHaveValue(/teclado/i);
  });
});
