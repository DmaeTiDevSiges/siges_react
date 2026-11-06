// Limite das fotos capturadas pela câmera (Capacitor).
//
// Sem width/height o plugin devolve a foto na resolução máxima do sensor
// (12–50 MP). Em base64 isso ocupa dezenas de MB na WebView e é causa comum
// de o APK fechar sozinho por falta de memória. 1600 px mantém leitura de
// placas/etiquetas e reduz o tamanho em ~10x.
export const CAMERA_PHOTO_LIMITS = {
    width: 1600,
    height: 1600,
    correctOrientation: true,
} as const;
