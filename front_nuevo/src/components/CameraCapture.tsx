import React, { useEffect } from 'react';
import { X, Camera, RotateCcw, Loader2 } from 'lucide-react';
import { useCameraCapture, type CameraCaptureResult } from '../hooks/useCameraCapture';

interface CameraCaptureProps {
  onCapture: (result: CameraCaptureResult) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const {
    isActive,
    isLoading,
    error,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
    hasMultipleCameras
  } = useCameraCapture();

  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    const result = await captureImage();
    if (result) {
      onCapture(result);
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Cerrar cámara"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        <h2 className="text-white font-medium">Capturar imagen</h2>
        
        {hasMultipleCameras && (
          <button
            onClick={switchCamera}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Cambiar cámara"
            disabled={isLoading}
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <p className="text-white text-sm">Iniciando cámara...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-6 mx-4 max-w-sm">
              <h3 className="text-white font-medium mb-2">Error de cámara</h3>
              <p className="text-white/90 text-sm mb-4">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Reintentar
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Camera overlay */}
        {isActive && !error && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Grid lines for composition */}
            <div className="absolute inset-4 border border-white/20">
              <div className="absolute top-1/3 left-0 right-0 border-t border-white/10" />
              <div className="absolute top-2/3 left-0 right-0 border-t border-white/10" />
              <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/10" />
              <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/10" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <button
            onClick={handleCapture}
            disabled={!isActive || isLoading || !!error}
            className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-lg"
            aria-label="Capturar imagen"
          >
            <Camera className="w-8 h-8 text-gray-800" />
          </button>
        </div>
        
        <p className="text-white/70 text-center text-sm mt-3">
          Toca el botón para capturar la imagen
        </p>
      </div>
    </div>
  );
};

export default CameraCapture;