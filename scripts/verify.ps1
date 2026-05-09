$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodePath = "C:\Program Files\nodejs"
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$maven = Join-Path $repoRoot ".tools\apache-maven-3.9.15\bin\mvn.cmd"

$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$nodePath;$env:Path"

Push-Location (Join-Path $repoRoot "frontend")
& "$nodePath\npm.cmd" run build
Pop-Location

Push-Location (Join-Path $repoRoot "admin-frontend")
& "$nodePath\npm.cmd" run build
Pop-Location

Push-Location (Join-Path $repoRoot "backend")
& $maven test
Pop-Location

Write-Host "CarHub verification completed successfully."
