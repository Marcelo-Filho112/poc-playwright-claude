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
1. Rode os testes (`npm test`, ou `npm test -- --project=public` para os sem login).
2. Se algo falhar, **investigue a causa real** (abra o trace/report, ou re-explore a pagina
   com `npm run explore -- <url>` para inspecionar o estado real).
3. Corrija o teste ou o locator com base no que observou — sem chutar.
4. Re-rode ate ficar verde.

---

# Fluxo /qa (pipeline de geracao de testes)

As atividades abaixo estao automatizadas como comandos em `.claude/commands/qa/`.
Use-os em vez de executar as etapas a mao:

| Comando | Argumentos | O que faz |
|---|---|---|
| `/qa:plan` | `<url> [--public]` | Explora o URL, versiona `specs/<slug>/{exploration.json, aria.yaml}`, cria `TESTDIR/seed.spec.ts` e gera `specs/<slug>/plan.md` via agente **playwright-test-planner** |
| `/qa:generate` | `<slug> [cenario\|grupo\|all]` | Fatia o plano em cenarios e gera os specs via agente **playwright-test-generator** (SEQUENCIAL — sessao de browser MCP unica) |
| `/qa:heal` | `<slug>` | Roda os testes do alvo e conserta ate verde via agente **playwright-test-healer** (Loop de QA) |
| `/qa:curate` | `<slug>` | Audita cobertura/convencoes/status via agente **playwright-test-curator** → `specs/<slug>/curation.md` |
| `/qa:pipeline` | `<url> [--public]` | Tudo acima em sequencia |

Artefatos por alvo (todos **versionados** e **editaveis a mao** — os comandos re-consomem):

```
specs/<slug>/{exploration.json, aria.yaml, plan.md, curation.md}
tests/<slug>/           # alvo autenticado (projeto chromium, herda .auth/user.json)
tests/public/<slug>/    # alvo publico (projeto public)
  └── seed.spec.ts + <cenario>.spec.ts (1 teste por arquivo)
```

Regras do fluxo:
- **A pasta do seed decide o projeto**: `tests/public/<slug>/` roda no projeto `public`;
  `tests/<slug>/` roda no `chromium` (autenticado). Heuristica: host ≠ localhost/BASE_URL
  → public; em duvida o comando pergunta.
- O `seed.spec.ts` por slug e o estado inicial de todos os cenarios do alvo (o
  `seed.spec.ts` da raiz e so um template de referencia — nao casa com nenhum projeto).
- `plan.md` e `curation.md` podem ser editados pelo humano; `/qa:generate` gera apenas
  cenarios sem spec, e `/qa:curate` sobrescreve o relatorio por completo (idempotente).
- `output/` e `screenshots/` sao scratch (gitignored); a copia canonica fica em `specs/<slug>/`.

---

# Atividades (consolidado)

O objetivo e **genérico**: dada qualquer pagina, explorar o que ela tem e gerar testes que
cobrem as funcionalidades presentes. O fluxo padrao abaixo e o que os comandos `/qa:*`
automatizam (use-o manualmente apenas para depurar uma etapa):

1. **Explorar** — `npm run explore -- <url>`. Gera em `output/`:
   `explore_<slug>.json` (inventario: textos, botoes, links, inputs, tabelas, graficos),
   `explore_<slug>.aria.yaml` (arvore role+name) e um screenshot em `screenshots/`.
2. **Observar** — ler esses arquivos. Os nomes acessiveis viram locators `getByRole(...)`.
3. **Gerar** — escrever o spec cobrindo cada categoria encontrada (tabela abaixo).
   - App propria/com login → `tests/` (herda a sessao autenticada).
   - Site publico/sem login → `tests/public/` (projeto `public`).
4. **Rodar e corrigir** — seguir o Loop de QA ate ficar verde.

## O que testar por categoria de funcionalidade
Cubra apenas o que a pagina realmente tem (o inventario diz o que existe):

| Funcionalidade | Como localizar | O que asserir |
|---|---|---|
| **Textos / titulos** | `getByRole('heading', { name })`, `getByText(...)` | conteudo esperado visivel: `toBeVisible()`, `toContainText(...)` |
| **Botoes** | `getByRole('button', { name })` | visivel/habilitado; ao clicar, muda estado/abre algo: `toBeEnabled()`, efeito pos-clique |
| **Links / navegacao** | `getByRole('link', { name })` | visivel; ao clicar, navega: `await expect(page).toHaveURL(...)` |
| **Tabelas** | `getByRole('table')`, `getByRole('row')`, `getByRole('cell', { name })` | cabecalhos presentes; nº de linhas (`toHaveCount`); celula com valor esperado |
| **Graficos** | `locator('svg')`, `locator('canvas')`, `getByRole('img', { name })` | renderizado/visivel: `toBeVisible()`; legenda/aria-label esperada |
| **Entradas → respostas** | `getByRole('textbox'/'searchbox'/'combobox'/'checkbox')`, `getByLabel(...)` | preencher/selecionar e validar a **resposta**: URL muda, resultado aparece, mensagem de validacao, valor refletido (`toHaveValue`), contagem de resultados |

Regra de ouro do "entradas → respostas": toda entrada deve ter uma assercao do **efeito**
(o que a pagina respondeu), nao so o preenchimento. Ex.: buscar um termo e verificar que a
lista de resultados aparece e a URL passa a conter o termo.

## Prompts prontos (genericos)
- **Explorar + gerar:** "Explore <url> e crie casos de teste cobrindo as funcionalidades da
  pagina: textos, botoes, tabelas, graficos e as respostas quando ha entradas (busca, filtros,
  formularios)."
- **Foco numa funcionalidade:** "Na pagina <url>, gere testes para a tabela X: cabecalhos,
  nº de linhas e que a celula Y mostra o valor esperado."
- **Entrada/resposta:** "Preencha o campo <campo> com <valor>, submeta e verifique a resposta
  (resultado/validacao/URL)."
- **Loop de QA:** "Rode os testes; se falhar, investigue (trace/report ou re-explore), corrija
  o locator/assert e re-rode ate passar. Nao invente locators."
- **Sessao autenticada:** "Garanta a sessao com `npm run auth`, depois teste o fluxo logado."
