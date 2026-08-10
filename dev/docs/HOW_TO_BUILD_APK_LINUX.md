# Como Gerar o APK do Android no Linux

Este guia descreve como configurar o ambiente Linux para gerar o APK do aplicativo Siges usando Capacitor.

## 1. Pré-requisitos

Para compilar o APK, você precisará instalar o JDK e o Android SDK.

### Java Development Kit (JDK)
Recomendado: **OpenJDK 17** (ou a versão exigida pela sua versão do Gradle).
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

### Android SDK
1. Baixe o **Command Line Tools** no [site oficial do Android](https://developer.android.com/studio#command-line-tools-only).
2. Extraia para uma pasta (ex: `~/Android/Sdk`).
3. Use o `sdkmanager` para instalar as plataformas necessárias:
```bash
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

## 2. Variáveis de Ambiente

Adicione estas linhas ao seu arquivo de configuração do shell (`~/.bashrc` ou `~/.zshrc`):

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```
*Lembre-se de rodar `source ~/.bashrc` após salvar.*

## 3. Passos para Gerar o APK

Sempre que houver alterações no código React, siga estes passos:

### Passo A: Build do Código Web
```bash
npm run build
```

### Passo B: Sincronizar com Capacitor
```bash
npx cap sync android
```

### Passo C: Gerar o APK via Gradle
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

## 4. Localização do APK Gerado

Após o sucesso do comando anterior, o arquivo estará em:
`android/app/build/outputs/apk/debug/app-debug.apk`

---
**Nota:** Se você estiver usando o **Android Studio** no Linux, você também pode simplesmente abrir a pasta `android` no IDE e seguir os mesmos passos de build visual (Build > Build APK).
