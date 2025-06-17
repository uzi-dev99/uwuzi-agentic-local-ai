
import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera as CameraIcon, RefreshCcw, X } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ open, onOpenChange, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Tu navegador no soporta acceso a la cámara");
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setIsLoading(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          toast.error("Permisos de cámara denegados. Por favor, permite el acceso en tu navegador.");
        } else if (err.name === 'NotFoundError') {
          toast.error("No se encontró ninguna cámara disponible.");
        } else {
          toast.error("Error al acceder a la cámara: " + err.message);
        }
      } else {
        toast.error("Error desconocido al acceder a la cámara");
      }
      onOpenChange(false);
    }
  }, [onOpenChange]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  React.useEffect(() => {
    if (open) {
      setCapturedImage(null);
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
        toast.success("Imagen capturada correctamente");
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };
  
  const handleConfirm = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
          onCapture(file);
          onOpenChange(false);
          toast.success("Imagen añadida a los adjuntos");
        })
        .catch(err => {
          console.error('Error creating file from capture:', err);
          toast.error("Error al procesar la imagen capturada");
        });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Capturar desde cámara</DialogTitle>
        </DialogHeader>
        <div className="relative bg-secondary rounded-md overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 bg-secondary">
              <p className="text-muted-foreground">Iniciando cámara...</p>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-auto rounded-md" />
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-auto rounded-md"
              style={{ maxHeight: '400px' }}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter className="flex-row justify-between">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={handleRetake}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Tomar otra
              </Button>
              <Button onClick={handleConfirm}>
                Confirmar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={handleCapture} disabled={!stream || isLoading}>
                <CameraIcon className="mr-2 h-4 w-4" /> Capturar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
