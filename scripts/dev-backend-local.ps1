$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$javaHome = "C:\Program Files\Java\jdk-21.0.10"
$maven = Join-Path $repoRoot ".tools\apache-maven-3.9.15\bin\mvn.cmd"

$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"

Push-Location (Join-Path $repoRoot "backend")
& $maven spring-boot:run "-Dspring-boot.run.profiles=local"
Pop-Location
