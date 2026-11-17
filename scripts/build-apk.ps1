# scripts/build-apk.ps1
# Gera o APK Android garantindo que JAVA_HOME e ANDROID_HOME estejam corretos.
# O build do React e o cap sync sao feitos automaticamente pelo hook do Gradle.

param([string]$Version)

$ErrorActionPreference = "Stop"

if ($Version) {
    $env:APP_VERSION = $Version
    Write-Host "[Version] $Version" -ForegroundColor Cyan
}

# Variaveis de ambiente
# Capacitor 8 pede Java 21; o Gradle 8.14 nao roda no Java 25 que vem no Android Studio 2026.x.
# Usa um JDK 21: baixado pelo Android Studio (Settings > Gradle > Gradle JDK > Download JDK, vai para
# ~\.jdks) ou instalado (winget install EclipseAdoptium.Temurin.21.JDK); senao, o JBR do Android Studio.
$jdk21 = @(
    Get-ChildItem "$env:USERPROFILE\.jdks" -Directory -Filter '*21*' -ErrorAction SilentlyContinue
    Get-ChildItem 'C:\Program Files\Eclipse Adoptium', 'C:\Program Files\Microsoft', 'C:\Program Files\Java' -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue
) | Where-Object { Test-Path "$($_.FullName)\bin\java.exe" } | Select-Object -First 1
$env:JAVA_HOME    = if ($jdk21) { $jdk21.FullName } else { "C:\Program Files\Android\Android Studio\jbr" }
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH         = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:PATH"

Write-Host ""
Write-Host "[Config] JAVA_HOME    = $env:JAVA_HOME" -ForegroundColor Cyan
Write-Host "[Config] ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    Write-Error "[ERRO] Java nao encontrado em $env:JAVA_HOME (instale o Android Studio)."; exit 1
}
if (-not (Test-Path "$env:ANDROID_HOME\platforms")) {
    Write-Error "[ERRO] Android SDK nao encontrado em $env:ANDROID_HOME. Abra o Android Studio > More Actions > SDK Manager e instale o SDK (Android SDK Platform + Build-Tools)."; exit 1
}

# android/local.properties (fora do git) pode vir de outra maquina (ex.: /home/.../Android/Sdk);
# o sdk.dir dele tem prioridade sobre ANDROID_HOME, entao corrige quando o caminho nao existe aqui.
$localProps = "android\local.properties"
$sdkDir = $null
if (Test-Path $localProps) {
    $line = Select-String -Path $localProps -Pattern '^sdk\.dir=(.*)$' | Select-Object -First 1
    if ($line) { $sdkDir = $line.Matches[0].Groups[1].Value -replace '\\\\', '\' -replace '\\:', ':' }
}
if (-not $sdkDir -or -not (Test-Path $sdkDir)) {
    $escaped = $env:ANDROID_HOME -replace '\\', '\\' -replace ':', '\:'
    $other = if (Test-Path $localProps) { Get-Content $localProps | Where-Object { $_ -notmatch '^sdk\.dir=' } } else { @() }
    Set-Content -Path $localProps -Value (@("sdk.dir=$escaped") + $other) -Encoding ascii
    Write-Host "[Config] local.properties: sdk.dir -> $env:ANDROID_HOME" -ForegroundColor Cyan
}

# Executa o Gradle diretamente. 
# O hook preBuild.dependsOn no 'android/app/build.gradle' executara o build do React e cap sync automaticamente.
Write-Host "[1/1] Gerando APK Debug (minificado)..." -ForegroundColor Yellow
Push-Location android
try {
    # gradle.properties fixa o Java do Linux (org.gradle.java.home); a linha de comando tem prioridade.
    .\gradlew.bat assembleDebug --warning-mode none "-Dorg.gradle.java.home=$env:JAVA_HOME"
    if ($LASTEXITCODE -ne 0) { Write-Error "[ERRO] Gradle falhou!"; exit 1 }
} finally {
    Pop-Location
}

# Resultado
Write-Host ""
Write-Host "[OK] APK Debug gerado com sucesso!" -ForegroundColor Green
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
Write-Host "[APK] $apkPath" -ForegroundColor Green
Write-Host ""
