# Como Gerar o APK do Android

O projeto foi configurado com **Capacitor** para permitir a geração de um aplicativo Android a partir do código React.

## Pré-requisitos
Para gerar o APK final, você precisa ter o ambiente de desenvolvimento Android configurado:
- **Java Development Kit (JDK) 21** (utilizando o JBR do Android Studio em `C:\Program Files\Android\Android Studio\jbr`)
- **Android Studio** (necessário para gerenciar SDKs e emuladores)
- **Variável de Ambiente JAVA_HOME**: `C:\Program Files\Android\Android Studio\jbr`
- **Variável de Ambiente ANDROID_HOME**: `C:\Users\Edukmattos\AppData\Local\Android\Sdk`

> ✅ **Automático:** O `app_version.txt` (usado pelo sistema de atualizações) é gerado automaticamente durante o `npm run build`. O hook no Gradle garante que isso sempre aconteça antes de qualquer build Android.

---

## Opção 1: Tudo em um comando (Recomendado)

Roda `npm run build` + `npx cap sync` + `gradlew assembleDebug` automaticamente:

```powershell
npm run apk
```

O APK gerado estará em `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Opção 2: Somente sincronizar (sem gerar APK via linha de comando)

Prepara o projeto para build no Android Studio (build + sync):

```powershell
npm run build:android
```

Depois abra o Android Studio e clique em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

> 🔒 O hook no `android/app/build.gradle` garante que `npm run build` + `npx cap sync` também rodem automaticamente quando o build é iniciado **pelo Android Studio**.

---

## Opção 3: Passo a passo manual

```powershell
# 1. Gera o app_version.txt e faz o build do React
npm run build

# 2. Sincroniza os assets com o projeto Android
npx cap sync

# 3. Gera o APK via Gradle
cd android
./gradlew assembleDebug
```

---

## Onde encontrar o APK gerado

```
android/app/build/outputs/apk/debug/app-debug.apk
```

