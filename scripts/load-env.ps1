$envScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envRepoRoot = Split-Path -Parent $envScriptRoot
$envFile = Join-Path $envRepoRoot ".env"

if (Test-Path -LiteralPath $envFile) {
  Get-Content -LiteralPath $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $name, $value = $line.Split("=", 2)
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")

    if ($name) {
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}
