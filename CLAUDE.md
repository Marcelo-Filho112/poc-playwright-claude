# CLAUDE.md — convencoes do POC Claude Code + Playwright CLI

Este repo demonstra o workflow do video *"Claude Code + Playwright CLI (Beginner
friendly guide to automated testing)"*: o agente dirige o navegador via **Playwright
CLI** (sem MCP), observa o resultado, ajusta e repete — gerando testes, corrigindo
falhas, mantendo sessao autenticada e fazendo scraping.

## App-alvo
- URL base em `BASE_URL` (arquivo `.env`, copiado de `.env.example`). Default: `http://localhost:3000`.
- Suba a app local antes de rodar testes/scraping. Para um demo publico, basta trocar `BASE_URL`.

## Sessao autenticada
- O estado de login fica em `.auth/user.json` (gerado, gitignored).
- Gera/regenera com: `npm run auth` (roda `auth/auth.setup.ts`).
- Os specs em `tests/` ja herdam essa sessao (projeto `chromium` depende de `setup`).
- Se um teste falhar por sessao expirada (redirect para /login), rode `npm run auth` de novo.

## Convencoes de teste
- **Locators**: prefira `getByRole`, `getByText`, `getByLabel`. Evite CSS/classe fragil.
- **Asserts**: web-first — `await expect(locator).toBeVisible()` (ja espera o elemento).
- **Nunca invente locators**: confirme no browser real via Playwright CLI antes de escrever.

## Onde salvar saidas
- Screenshots: `screenshots/`
- Resultado de scraping: `output/` (ex.: `output/items.json`)

## Execucao via container (sem Node no host)
- `docker-compose.yml` usa a imagem oficial do Playwright e mapeia todo o repo em `/work`.
- Atalho Windows: `.\pw.ps1 <cmd>` (ex.: `.\pw.ps1 npm test`). Equivale a `docker compose run --rm pw <cmd>`.
- App no host? No `.env`: `BASE_URL=http://host.docker.internal:3000`.
- Mantenha headless no container; `--headed`/`test:ui` precisam de display (rode no host).

## Comandos
- Rodar testes: `npm test`  |  modo UI: `npm run test:ui`
- Relatorio: `npm run report`
- Setup de auth: `npm run auth`
- Scraping: `npm run scrape`
- Playwright CLI (dirigir o browser): `playwright-cli open <url> --headed`, `goto`, `click`,
  `type`, `snapshot`, `screenshot`, ... (`playwright-cli --help`).

## Loop de QA (importante)
Ao pedir para rodar/consertar testes, siga o loop:
1. Rode os testes em `tests/` (`npm test`).
2. Se algo falhar, **investigue a causa real** (abra o trace/report, ou dirija o browser via
   `playwright-cli` para inspecionar o estado real da pagina).
3. Corrija o teste ou o locator com base no que observou — sem chutar.
4. Re-rode ate ficar verde.

Prompts prontos para cada funcionalidade: ver `docs/prompts.md`.
