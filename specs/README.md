# Specs — artefatos de QA versionados por alvo

Cada alvo explorado (URL) ganha um diretorio `specs/<slug>/` (mesmo slug gerado pelo
`npm run explore`). Os artefatos sao **versionados** e podem ser editados a mao —
os comandos `/qa:*` os re-consomem nas proximas execucoes.

```
specs/<slug>/
├── exploration.json   # inventario da pagina (headings, botoes, links, inputs, tabelas, graficos)
├── aria.yaml          # ARIA snapshot (arvore role+name — ground truth dos locators getByRole)
├── plan.md            # plano de testes (cenarios numerados, steps, expects) — editavel
└── curation.md        # relatorio de curadoria (cobertura, convencoes, status) — regenerado por /qa:curate
```

Os testes correspondentes ficam em `tests/<slug>/` (autenticado, projeto `chromium`)
ou `tests/public/<slug>/` (sem login, projeto `public`), sempre com um `seed.spec.ts`
que define o estado inicial dos cenarios.

> `output/` e `screenshots/` sao scratch (gitignored): guardam o historico bruto das
> exploracoes. A copia canonica usada para gerar o plano fica aqui em `specs/<slug>/`.

Fluxo: `/qa:plan <url>` → `/qa:generate <slug>` → `/qa:heal <slug>` → `/qa:curate <slug>`
(ou tudo de uma vez: `/qa:pipeline <url>`). Ver CLAUDE.md, secao "Fluxo /qa".
