$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodePath = "C:\Program Files\nodejs"

. (Join-Path $PSScriptRoot "load-env.ps1")

$env:Path = "$nodePath;$env:Path"

Push-Location (Join-Path $repoRoot "provider-frontend")
& "$nodePath\npm.cmd" run dev
Pop-Location
