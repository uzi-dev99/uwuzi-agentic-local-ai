import { useState, useRef, useCallback } from 'react';

export interface CameraCaptureResult {
  file: File;
  preview: string;
}

export interface UseCameraCaptureReturn {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => Promise<CameraCaptureResult | null>;
  switchCamera: () => Promise<void>;
  hasMultipleCameras: boolean;
}

export const useCameraCapture = (): UseCameraCaptureReturn => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      await checkCameraDevices();
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Could not access camera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentFacingMode, checkCameraDevices]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setError(null);
  }, []);

  const switchCamera = useCallback(async () => {
    if (!hasMultipleCameras) return;
    
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);
    
    if (isActive) {
      await startCamera();
    }
  }, [hasMultipleCameras, currentFacingMode, isActive, startCamera]);

  const captureImage = useCallback(async (): Promise<CameraCaptureResult | null> => {
    if (!videoRef.current || !streamRef.current) {
      setError('Camera is not active');
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to capture image'));
            return;
          }

          // Create file from blob
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const file = new File([blob], `camera-capture-${timestamp}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          // Create preview URL
          const preview = URL.createObjectURL(blob);

          resolve({ file, preview });
        }, 'image/jpeg', 0.9);
      });
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Failed to capture image');
      return null;
    }
  }, []);

  return {
    isActive,
    isLoading,
    error,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
    hasMultipleCameras
  };
};