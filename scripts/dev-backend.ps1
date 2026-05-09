$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$maven = Join-Path $repoRoot ".tools\apache-maven-3.9.15\bin\mvn.cmd"

$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"

Push-Location (Join-Path $repoRoot "backend")
& $maven spring-boot:run
Pop-Location
