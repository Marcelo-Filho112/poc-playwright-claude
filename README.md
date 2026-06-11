# POC — Claude Code + Playwright CLI

Proof of concept reproduzindo as funcionalidades do video
[*Claude Code + Playwright CLI (Beginner friendly guide to automated testing)*](https://www.youtube.com/watch?v=tpeQts8pFBw):
geracao de testes em linguagem natural, loop de QA, sessoes autenticadas e
scraping/automacao — com o Claude Code dirigindo o browser e orquestrando agentes
de planejamento, geracao, correcao e curadoria de testes.

## Requisito unico

**[Claude Code](https://claude.com/claude-code) instalado no host, executando via CLI.**
Todo o resto (Node, browsers, Playwright) pode rodar no host **ou** dentro do container —
o Claude Code orquestra os dois cenarios da mesma forma.

```powershell
# na raiz do repo
claude
```

Ao abrir a sessao no repo, o Claude Code carrega automaticamente:
- os comandos `/qa:*` (`.claude/commands/qa/`) — o pipeline de geracao de testes;
- os agentes (`.claude/agents/`) — planner, generator, healer e curator;
- o MCP `playwright-test` (`.mcp.json`) e a skill `playwright-cli`.

## Uso principal — pipeline /qa

Dentro da sessao do Claude Code, um unico comando explora a pagina, planeja, gera,
conserta e faz a curadoria dos testes:

```text
/qa:pipeline https://exemplo.com --public     # site publico (sem login)
/qa:pipeline http://localhost:3000            # app propria (sessao autenticada)
```

Ou por fase, quando quiser controlar/retomar cada etapa:

| Comando | O que faz |
|---|---|
| `/qa:plan <url> [--public]` | explora a pagina e gera o plano `specs/<slug>/plan.md` |
| `/qa:generate <slug> [cenario\|all]` | gera os specs em `tests[/public]/<slug>/` a partir do plano |
| `/qa:heal <slug>` | roda os testes e conserta ate verde (Loop de QA) |
| `/qa:curate <slug>` | audita cobertura/convencoes → `specs/<slug>/curation.md` |

Os artefatos ficam **versionados** e editaveis a mao (os comandos re-consomem):

```
specs/<slug>/{exploration.json, aria.yaml, plan.md, curation.md}
tests/<slug>/ ou tests/public/<slug>/  → seed.spec.ts + 1 spec por cenario
```

Tambem funciona em linguagem natural: *"Explore <url> e crie casos de teste cobrindo
tabelas, graficos, botoes, textos e as respostas a entradas"*.

## Setup do ambiente de execucao

```bash
cp .env.example .env   # ajuste BASE_URL, TEST_USER, TEST_PASS
```

### Opcao A — local (Node no host)

E o caminho mais direto: o Claude Code roda os comandos npm/playwright direto no host.

```bash
npm install
npx playwright install chromium

# (opcional) CLI standalone para dirigir o browser, abordagem do video
npm install -g @playwright/cli@latest
playwright-cli install --skills
```

```bash
npm run auth     # loga uma vez e salva a sessao em .auth/user.json
npm test         # roda os testes (setup + autenticado + public)
npm run test:ui  # modo UI interativo (precisa de display)
npm run report   # abre o relatorio HTML
npm run explore -- <url>   # inventaria uma pagina (output/ + screenshot)
npm run scrape   # extrai dados para output/items.json
```

### Opcao B — via container (sem Node no host)

A imagem oficial do Playwright ja traz Node, browsers e deps de sistema. Todo o repo
e mapeado em `/work` (veja `docker-compose.yml`). O Claude Code continua no host e
executa os comandos atraves do atalho `.\pw.ps1` (equivale a
`docker compose run --rm pw <cmd>`):

```powershell
.\pw.ps1 npm install
.\pw.ps1 npm run auth
.\pw.ps1 npm test
.\pw.ps1 npm run explore -- https://exemplo.com
.\pw.ps1 npm run report -- --host 0.0.0.0   # relatorio em http://localhost:9323
```

Avisos do modo container:
- App rodando no host? No `.env` use `BASE_URL=http://host.docker.internal:3000`
  (o `localhost` do container nao e o seu).
- Mantenha headless no container; `--headed` e `test:ui` precisam de display (host).
- Os agentes via MCP `playwright-test` abrem browser no **host** — para o pipeline
  `/qa:*` completo com agentes, a Opcao A e a recomendada; no container, peca ao
  Claude Code para executar as fases com `.\pw.ps1` (ele segue o mesmo fluxo).

## Estrutura

- `playwright.config.ts` — baseURL por env; projetos `setup` (auth), `chromium` (com login), `public` (sem login).
- `auth/auth.setup.ts` — login + storageState (`.auth/user.json`).
- `tests/<slug>/` — specs com login; `tests/public/<slug>/` — specs sem login (1 teste por arquivo + seed).
- `specs/<slug>/` — artefatos versionados por alvo: inventario, ARIA snapshot, plano de testes e curadoria.
- `scripts/explore.ts` — inventaria funcionalidades de uma pagina (textos, botoes, tabelas, graficos, inputs).
- `scripts/scrape.ts` — exemplo de scraping.
- `.claude/commands/qa/` — comandos `/qa:*`; `.claude/agents/` — planner/generator/healer/curator.
- `CLAUDE.md` — convencoes, Fluxo /qa e Loop de QA.

> A app-alvo e local (`BASE_URL`, default `http://localhost:3000`). Para um demo publico,
> use `--public` no `/qa:plan`/`/qa:pipeline` ou troque so o `BASE_URL`.

## Exemplo real incluido

O alvo publico `https://the-internet.herokuapp.com/tables` ja passou pelo pipeline:
veja `specs/the_internet_herokuapp_com_tables/` (plano + curadoria) e
`tests/public/the_internet_herokuapp_com_tables/` (7 specs verdes). Para re-rodar:

```bash
npx playwright test tests/public/the_internet_herokuapp_com_tables --project=public
```
