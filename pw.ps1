# Atalho para rodar comandos no container Playwright (Windows PowerShell).
#
#   .\pw.ps1 npm install
#   .\pw.ps1 npm run auth
#   .\pw.ps1 npm test
#   .\pw.ps1 npm run scrape
#   .\pw.ps1 bash            # shell interativo dentro do container
#
# Equivale a: docker compose run --rm pw <args>
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

if (-not $Args -or $Args.Count -eq 0) {
  Write-Host "Uso: .\pw.ps1 <comando>   (ex.: .\pw.ps1 npm test)"
  exit 1
}

docker compose run --rm pw @Args
exit $LASTEXITCODE
