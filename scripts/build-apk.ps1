# scripts/build-apk.ps1
# Gera o APK Android garantindo que JAVA_HOME e ANDROID_HOME estejam corretos.
# O build do React e o cap sync sao feitos automaticamente pelo hook do Gradle.

$ErrorActionPreference = "Stop"

# Variaveis de ambiente
$env:JAVA_HOME    = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH         = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:PATH"

Write-Host ""
Write-Host "[Config] JAVA_HOME    = $env:JAVA_HOME" -ForegroundColor Cyan
Write-Host "[Config] ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host ""

# Executa o Gradle diretamente. 
# O hook preBuild.dependsOn no 'android/app/build.gradle' executara o build do React e cap sync automaticamente.
Write-Host "[1/1] Gerando APK Debug (minificado)..." -ForegroundColor Yellow
Push-Location android
try {
    .\gradlew.bat assembleDebug
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
