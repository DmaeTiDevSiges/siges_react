# Como Gerar o APK do Android

O projeto foi configurado com **Capacitor** para permitir a geração de um aplicativo Android a partir do código React.

## Pré-requisitos
Para gerar o APK final, você precisa ter o ambiente de desenvolvimento Android configurado:
- **Java Development Kit (JDK) 21** (utilizando o JBR do Android Studio em `C:\Program Files\Android\Android Studio\jbr`)
- **Android Studio** (necessário para gerenciar SDKs e emuladores)
- **Variável de Ambiente JAVA_HOME**: `C:\Program Files\Android\Android Studio\jbr`
- **Variável de Ambiente ANDROID_HOME**: `C:\Users\Edukmattos\AppData\Local\Android\Sdk`

## Passos para gerar o APK

### Opção 1: Usando o Android Studio (Recomendado)
1.  Abra o Android Studio.
2.  Selecione **Open** e navegue até a pasta `d:\AG\Siges\android`.
3.  Aguarde o Android Studio sincronizar o projeto e baixar as dependências do Gradle.
4.  No menu superior, vá em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5.  O APK gerado estará em `android/app/build/outputs/apk/debug/app-debug.apk`.

### Opção 2: Via Linha de Comando
Se você já tiver o Java e o Android SDK configurados no seu terminal:

1.  Navegue até a pasta android:
    ```powershell
    cd android
    ```
2.  Execute o comando de build:
    ```powershell
    ./gradlew assembleDebug
    ```
    *(Se falhar com erro de JAVA_HOME, verifique sua instalação do Java)*

## Atualizando o App
Sempre que fizer alterações no código React (`src`), execute os seguintes comandos para atualizar o projeto Android:

```powershell
npm run build
npx cap sync
```

Em seguida, gere o APK novamente.
