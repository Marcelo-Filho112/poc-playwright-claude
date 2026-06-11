import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

/**
 * Explorador GENERICO de pagina para geracao de testes (workflow do video).
 *
 * O agente (Claude Code) dispara este script apontando para uma URL. Ele inventaria
 * as FUNCIONALIDADES presentes na pagina, independente do site:
 *   - textos/titulos (headings, landmarks)
 *   - botoes e links (acoes)
 *   - campos de entrada (inputs, selects, checkboxes, radios)
 *   - tabelas (cabecalhos + nº de linhas)
 *   - graficos (svg / canvas / imagens com role)
 * e captura a ARIA snapshot (base dos locators getByRole) + um screenshot.
 *
 * O agente le esses arquivos e escreve os tests/*.spec.ts grounded no que existe de fato,
 * cobrindo cada categoria encontrada (ver CLAUDE.md > "Atividades").
 *
 * Uso:
 *   docker compose run --rm pw npm run explore -- <url>
 *   (ou .\pw.ps1 npm run explore -- <url>)
 */
const url =
  process.argv[2] ?? process.env.EXPLORE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';
const slug = url
  .replace(/^https?:\/\//, '')
  .replace(/[^a-z0-9]+/gi, '_')
  .replace(/_+$/g, '')
  .slice(0, 60);

async function main() {
  const browser = await chromium.launch();
  // Contexto "realista" reduz bloqueios de anti-bot em sites publicos.
  const context = await browser.newContext({
    locale: 'pt-BR',
    viewport: { width: 1366, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

  const title = await page.title();
  const finalUrl = page.url();

  // ARIA snapshot: arvore concisa de role+name, ideal para escolher locators getByRole.
  const aria = await page.locator('body').ariaSnapshot();

  // Nomes acessiveis de elementos de um dado role (limitado para nao explodir).
  async function namesOf(
    role: 'link' | 'button' | 'textbox' | 'searchbox' | 'combobox' | 'checkbox' | 'radio' | 'heading',
    limit = 40,
  ) {
    const els = await page.getByRole(role).all();
    const out: string[] = [];
    for (const el of els.slice(0, limit)) {
      const name = (await el.getAttribute('aria-label')) ?? (await el.textContent()) ?? '';
      const clean = name.replace(/\s+/g, ' ').trim();
      if (clean) out.push(clean);
    }
    return [...new Set(out)];
  }

  // Tabelas: para cada uma, cabecalhos e contagem de linhas do corpo.
  const tables = await page.locator('table').evaluateAll((nodes) =>
    nodes.slice(0, 10).map((t) => {
      const headers = Array.from(t.querySelectorAll('th')).map((h) =>
        (h.textContent ?? '').replace(/\s+/g, ' ').trim(),
      );
      const bodyRows = t.querySelectorAll('tbody tr').length || t.querySelectorAll('tr').length;
      const caption = (t.querySelector('caption')?.textContent ?? '').replace(/\s+/g, ' ').trim();
      return { caption, headers: headers.filter(Boolean).slice(0, 20), rows: bodyRows };
    }),
  );

  // Graficos: contagem de svg/canvas e imagens com papel grafico.
  const charts = await page.evaluate(() => ({
    svg: document.querySelectorAll('svg').length,
    canvas: document.querySelectorAll('canvas').length,
    imgRoleImg: document.querySelectorAll('[role="img"], figure').length,
  }));

  const inventory = {
    texts: { headings: await namesOf('heading', 30) },
    actions: { buttons: await namesOf('button'), links: await namesOf('link') },
    inputs: {
      searchboxes: await namesOf('searchbox'),
      textboxes: await namesOf('textbox'),
      comboboxes: await namesOf('combobox', 15),
      checkboxes: await namesOf('checkbox', 20),
      radios: await namesOf('radio', 20),
    },
    tables,
    charts,
  };

  const outDir = path.join(process.cwd(), 'output');
  const shotDir = path.join(process.cwd(), 'screenshots');
  await mkdir(outDir, { recursive: true });
  await mkdir(shotDir, { recursive: true });

  const shot = path.join(shotDir, `explore_${slug}.png`);
  await page.screenshot({ path: shot, fullPage: false });

  const report = { url, finalUrl, title, exploredAt: new Date().toISOString(), inventory };
  await writeFile(path.join(outDir, `explore_${slug}.json`), JSON.stringify(report, null, 2), 'utf-8');
  await writeFile(path.join(outDir, `explore_${slug}.aria.yaml`), aria, 'utf-8');

  console.log('=== EXPLORACAO ===');
  console.log('slug      :', slug);
  console.log('title     :', title);
  console.log('finalUrl  :', finalUrl);
  console.log('headings  :', inventory.texts.headings.slice(0, 6));
  console.log('inputs    :', {
    search: inventory.inputs.searchboxes.length,
    text: inventory.inputs.textboxes.length,
    select: inventory.inputs.comboboxes.length,
    check: inventory.inputs.checkboxes.length,
    radio: inventory.inputs.radios.length,
  });
  console.log('buttons   :', inventory.actions.buttons.length, '| links:', inventory.actions.links.length);
  console.log('tables    :', tables.length, tables.map((t) => `${t.headers.length}col/${t.rows}lin`));
  console.log('charts    :', charts);
  console.log('relatorio :', `output/explore_${slug}.json`);
  console.log('aria tree :', `output/explore_${slug}.aria.yaml`);
  console.log('screenshot:', `screenshots/explore_${slug}.png`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
