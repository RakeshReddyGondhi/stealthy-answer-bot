<#
Call the deployed Vercel setup endpoint.

Usage:
  # set these env vars first, or pass them inline
  $env:VERCEL_SETUP_URL = 'https://<your-deployment>.vercel.app/api/setup-database'
  $env:SETUP_TOKEN = '<your-token>'

  ./scripts/call-vercel-setup.ps1

This will POST to the endpoint with the required x-setup-token header and print the JSON response.
#>

param(
  [string]$Url = $env:VERCEL_SETUP_URL,
  [string]$Token = $env:SETUP_TOKEN
)

if (-not $Url) {
  Write-Host "Missing VERCEL_SETUP_URL. Set environment variable VERCEL_SETUP_URL or pass -Url." -ForegroundColor Yellow
  exit 1
}
if (-not $Token) {
  Write-Host "Missing SETUP_TOKEN. Set environment variable SETUP_TOKEN or pass -Token." -ForegroundColor Yellow
  exit 1
}

Write-Host "Calling $Url ..."

try {
  $resp = Invoke-RestMethod -Uri $Url -Method Post -Headers @{ 'x-setup-token' = $Token } -UseBasicParsing
  Write-Host "Response:`n" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 5
} catch {
  Write-Host "Request failed:" -ForegroundColor Red
  $_ | Format-List * -Force
  exit 1
}
