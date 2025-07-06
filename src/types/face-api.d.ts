declare module 'face-api.js' {
  export interface TinyFaceDetectorOptions {
    inputSize?: number;
    scoreThreshold?: number;
  }

  export interface FaceDetection {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    score: number;
  }

  export class TinyFaceDetectorOptions {
    constructor(options?: {
      inputSize?: number;
      scoreThreshold?: number;
    });
  }

  export const nets: {
    tinyFaceDetector: {
      loadFromUri(uri: string): Promise<void>;
    };
  };

  export function detectAllFaces(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    options?: TinyFaceDetectorOptions
  ): Promise<FaceDetection[]>;
} 