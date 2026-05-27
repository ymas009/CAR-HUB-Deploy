$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$javaHome = "C:\Program Files\Java\jdk-21.0.10"
$maven = Join-Path $repoRoot ".tools\apache-maven-3.9.15\bin\mvn.cmd"

. (Join-Path $PSScriptRoot "load-env.ps1")

$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"

Push-Location (Join-Path $repoRoot "backend")
& $maven spring-boot:run
Pop-Location
