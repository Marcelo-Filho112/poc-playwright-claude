# Prompts prontos — workflows do video

Copie/cole no Claude Code. Ele dirige o browser via **Playwright CLI** para descobrir os
locators reais antes de escrever/ajustar codigo. Veja convencoes em `../CLAUDE.md`.

## 1. Geracao de teste (linguagem natural -> spec)
> Escreva um teste Playwright que loga, navega ate o dashboard, confirma o nome do usuario
> no header e verifica que o botao "Criar Relatorio" esta visivel. Use o Playwright CLI para
> abrir a app (BASE_URL), descobrir os locators reais por role/text/label e salve em
> `tests/`.

## 2. Loop de QA (rodar -> diagnosticar -> corrigir -> repetir)
> Rode os testes em `./tests/`. Se houver falha, identifique a causa real (abra o
> trace/report ou inspecione a pagina via Playwright CLI), corrija o teste/locator e re-rode
> ate todos passarem. Nao invente locators.

## 3. Sessao autenticada
> Garanta a sessao com `npm run auth`. Depois carregue o storage de `.auth/user.json`,
> navegue ate o dashboard e verifique que o header mostra o usuario logado.

## 4. Scraping / automacao
> Navegue ate a home (BASE_URL), extraia os 10 primeiros itens (titulo + URL) e salve em
> `output/items.json`. Adapte `scripts/scrape.ts` ao conteudo real da pagina.

## Comandos uteis de Playwright CLI
```bash
playwright-cli open http://localhost:3000 --headed   # abre o browser visivel
playwright-cli goto /dashboard                        # navega
playwright-cli snapshot                               # tira snapshot acessivel (locators)
playwright-cli click "role=button[name=Entrar]"       # interage
playwright-cli screenshot screenshots/home.png        # captura tela
playwright-cli --help                                 # lista todos os comandos
```
