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

# Auto-detectar JAVA_HOME se não estiver definido
if [ -z "$JAVA_HOME" ]; then
    JAVA_HOME_BIN=$(readlink -f "$(which java)" 2>/dev/null | sed 's|/bin/java||')
    if [ -n "$JAVA_HOME_BIN" ]; then
        export JAVA_HOME="$JAVA_HOME_BIN"
    fi
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

echo "[1/1] Gerando APK Debug..."
cd android
./gradlew assembleDebug --warning-mode none
cd ..

echo ""
echo "[OK] APK Debug gerado com sucesso!"
echo "[APK] android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
