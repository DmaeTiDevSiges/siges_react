#!/bin/bash
# Script de instalação de dependências Android
# Execute com: sudo bash scripts/install-deps.sh

set -e

echo "=== [1/3] Instalando OpenJDK 17 ==="
sudo apt update
sudo apt install -y openjdk-17-jdk

echo ""
echo "=== [2/3] Instalando Android SDK ==="
mkdir -p ~/Android/Sdk/cmdline-tools
cd ~/Android/Sdk/cmdline-tools

if [ ! -d "latest" ]; then
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
    unzip -q cmdline-tools.zip
    mv cmdline-tools latest
    rm cmdline-tools.zip
fi

echo "=== [3/3] Instalando componentes Android ==="
yes | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --licenses
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

echo ""
echo "=== Configurando variáveis de ambiente ==="

# JAVA_HOME
if ! grep -q "JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" ~/.bashrc; then
    echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
    echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
fi

# ANDROID_HOME
if ! grep -q "ANDROID_HOME=~/Android/Sdk" ~/.bashrc; then
    echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.bashrc
    echo 'export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH' >> ~/.bashrc
fi

echo ""
echo "=== Concluído! ==="
echo "Execute: source ~/.bashrc"
echo "Depois: npm run apk"
