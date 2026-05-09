$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodePath = "C:\Program Files\nodejs"
$env:Path = "$nodePath;$env:Path"

Push-Location (Join-Path $repoRoot "admin-frontend")
& "$nodePath\npm.cmd" run dev
Pop-Location
