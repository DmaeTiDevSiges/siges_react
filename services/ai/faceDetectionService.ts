// Service to verify if a human face exists in an image (for avatar uploads)

const loadedScripts = new Set<string>();

const loadExternalScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (loadedScripts.has(src)) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            loadedScripts.add(src);
            resolve(true);
        };
        script.onerror = (err) => {
            console.warn(`[faceDetectionService] Failed to load script ${src}:`, err);
            resolve(false);
        };
        document.head.appendChild(script);
    });
};

const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
};

export interface FaceVerificationResult {
    hasFace: boolean;
    faceCount: number;
    error?: string;
}

/**
 * Verifies if an image (DataURL, File, or Blob) contains at least one human face.
 */
export async function verifyHumanFaceInImage(
    imageSource: string | File | Blob
): Promise<FaceVerificationResult> {
    try {
        let dataUrl = '';
        if (typeof imageSource === 'string') {
            dataUrl = imageSource;
        } else {
            dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(imageSource);
            });
        }

        const img = await loadImageElement(dataUrl);

        // Tier 1: Try Native Chromium FaceDetector API (Built into Android Chrome / WebView)
        if (typeof (window as any).FaceDetector !== 'undefined') {
            try {
                const nativeDetector = new (window as any).FaceDetector({ fastMode: false, maxFaces: 10 });
                const faces = await nativeDetector.detect(img);
                const count = faces ? faces.length : 0;
                return {
                    hasFace: count > 0,
                    faceCount: count
                };
            } catch (nativeErr) {
                console.warn("[faceDetectionService] Native FaceDetector error, falling back to MediaPipe:", nativeErr);
            }
        }

        // Tier 2: Try MediaPipe Tasks Vision via UMD script
        try {
            const loaded = await loadExternalScript('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.js');
            const vision = (window as any).tasksVision || (window as any).vision;

            if (loaded && vision) {
                const { FaceDetector, FilesetResolver } = vision;
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                );

                let detector: any = null;
                try {
                    detector = await FaceDetector.createFromOptions(filesetResolver, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                            delegate: "GPU"
                        },
                        runningMode: "IMAGE"
                    });
                } catch (gpuErr) {
                    detector = await FaceDetector.createFromOptions(filesetResolver, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                            delegate: "CPU"
                        },
                        runningMode: "IMAGE"
                    });
                }

                if (detector) {
                    const result = detector.detect(img);
                    const count = result?.detections ? result.detections.length : 0;
                    return {
                        hasFace: count > 0,
                        faceCount: count
                    };
                }
            }
        } catch (mpErr) {
            console.warn("[faceDetectionService] MediaPipe verification error:", mpErr);
        }

        // Fallback: If offline and no native detector, allow with warning
        console.warn("[faceDetectionService] Could not run face detector, fallback active");
        return {
            hasFace: true,
            faceCount: 1
        };
    } catch (err: any) {
        console.error("[faceDetectionService] Exception verifying face:", err);
        return {
            hasFace: false,
            faceCount: 0,
            error: err?.message || 'Erro ao processar imagem'
        };
    }
}
