declare module 'face-api.js' {
  export interface TinyFaceDetectorOptions {
    inputSize?: number;
    scoreThreshold?: number;
  }

  export interface SsdMobilenetv1Options {
    minConfidence?: number;
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

  export class SsdMobilenetv1Options {
    constructor(options?: {
      minConfidence?: number;
    });
  }

  export const nets: {
    tinyFaceDetector: {
      loadFromUri(uri: string): Promise<void>;
    };
    ssdMobilenetv1: {
      loadFromUri(uri: string): Promise<void>;
    };
  };

  export function detectAllFaces(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    options?: TinyFaceDetectorOptions | SsdMobilenetv1Options
  ): Promise<FaceDetection[]>;
} 