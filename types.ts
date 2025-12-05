export interface UploadedPhoto {
  id: string;
  url: string;
  file: File;
  caption: string; // User written text
}

export interface FramedPhotoData {
  id: string;
  originalUrl: string;
  framedUrl: string; // The base64 data of the photo with the polaroid frame
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  scale: number; // Zoom level
}

export interface CameraState {
  isProcessing: boolean;
  progress: number;
  queueCount: number; // How many photos are inside waiting to be ejected
}

export interface BackgroundTheme {
  id: string;
  name: string;
  cssBackground: string; // CSS value for background prop
  previewColor: string; // Small color swatch for UI
}