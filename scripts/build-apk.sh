#!/bin/bash
# scripts/build-apk.sh
# Gera o APK Android no Linux/Mac

set -e

# Auto-detectar SDK Android
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
    fi
fi

# Auto-detectar JAVA_HOME — sempre validar se é válido
JAVA_HOME_CANDIDATE=""
if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
    JAVA_HOME_CANDIDATE="/usr/lib/jvm/java-17-openjdk-amd64"
elif command -v java &>/dev/null; then
    JAVA_HOME_CANDIDATE=$(readlink -f "$(which java)" 2>/dev/null | sed 's|/bin/java||')
fi

if [ -n "$JAVA_HOME_CANDIDATE" ] && [ -x "$JAVA_HOME_CANDIDATE/bin/java" ]; then
    export JAVA_HOME="$JAVA_HOME_CANDIDATE"
elif [ -z "$JAVA_HOME" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
    echo "ERROR: JAVA_HOME não encontrado. Instale: sudo apt install openjdk-17-jdk"
    exit 1
fi

# Versão do app (opcional: ./build-apk.sh 2.0.0)
VERSION_ARG="${1:-}"
if [ -n "$VERSION_ARG" ]; then
    export APP_VERSION="$VERSION_ARG"
    echo "[Version] $VERSION_ARG"
fi

echo ""
echo "[Config] JAVA_HOME    = $JAVA_HOME"
echo "[Config] ANDROID_HOME = $ANDROID_HOME"
echo ""

# Corrigir symlinks do node_modules/.bin caso o projeto esteja em partição NTFS compartilhada com Windows
node scripts/fix-bin-symlinks.js

# Cache do Gradle no SSD Linux nativo para evitar erros de I/O e locks na partição NTFS
GRADLE_CACHE_DIR="${GRADLE_USER_HOME:-$HOME/.gradle}/caches/siges-project-cache"
mkdir -p "$GRADLE_CACHE_DIR"

echo "[1/1] Gerando APK Debug..."
cd android
./gradlew assembleDebug --warning-mode none --project-cache-dir "$GRADLE_CACHE_DIR"
cd ..

echo ""
echo "[OK] APK Debug gerado com sucesso!"
echo "[APK] android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
