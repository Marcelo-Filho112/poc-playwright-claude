# POC — Claude Code + Playwright CLI

Proof of concept reproduzindo as funcionalidades do video
[*Claude Code + Playwright CLI (Beginner friendly guide to automated testing)*](https://www.youtube.com/watch?v=tpeQts8pFBw):
geracao de testes em linguagem natural, loop de QA, sessoes autenticadas e
scraping/automacao — com o Claude Code dirigindo o browser via **Playwright CLI**
(token-efficient, sem servidor MCP).

## Setup

```bash
cp .env.example .env   # ajuste BASE_URL, TEST_USER, TEST_PASS
```

### Opcao A — via container (recomendado, nao precisa de Node no host)

A imagem oficial do Playwright ja traz Node, browsers e deps de sistema. Todo o repo
e mapeado em `/work` (veja `docker-compose.yml`).

```powershell
.\pw.ps1 npm install          # ou: docker compose run --rm pw npm install
.\pw.ps1 npm run auth
.\pw.ps1 npm test
.\pw.ps1 npm run scrape
.\pw.ps1 npm run report -- --host 0.0.0.0   # relatorio em http://localhost:9323
```

> App rodando no host? No `.env` use `BASE_URL=http://host.docker.internal:3000`
> (o `localhost` do container nao e o seu).

### Opcao B — Node instalado no host

```bash
npm install
npx playwright install chromium

# CLI de agentes + skills para o Claude Code (a abordagem do video)
npm install -g @playwright/cli@latest
playwright-cli install --skills
```

## Uso (host)

```bash
npm run auth     # loga uma vez e salva a sessao em .auth/user.json
npm test         # roda os testes (smoke + autenticado)
npm run test:ui  # modo UI interativo
npm run report   # abre o relatorio HTML
npm run scrape   # extrai dados para output/items.json
```

> Modo headed (`--headed`) e `test:ui` precisam de display grafico — rode no host.
> No container, mantenha headless (`npm test`, `npm run scrape`).

## Estrutura
- `playwright.config.ts` — baseURL por env, projeto `setup` (auth) + `chromium` (testes).
- `auth/auth.setup.ts` — login + storageState.
- `tests/` — specs (moldes: smoke e autenticado).
- `scripts/scrape.ts` — exemplo de scraping.
- `CLAUDE.md` — convencoes que o agente usa (locators, loop de QA, onde salvar saidas).
- `docs/prompts.md` — prompts prontos para cada workflow.

> A app-alvo e local (`BASE_URL`, default `http://localhost:3000`). Para um demo publico,
> troque so o `BASE_URL`. Ajuste rotas/locators dos exemplos para a sua app.
