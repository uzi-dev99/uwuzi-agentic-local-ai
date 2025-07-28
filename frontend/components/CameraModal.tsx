import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraModalProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    const enableStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Could not access camera. Please grant permission in your browser settings.');
        console.error("Camera access error:", err);
      }
    };

    if (!stream) {
        enableStream();
    }

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stream?.getTracks().forEach(track => track.stop());
    }
  }, [stream]);
  
  const handleRetake = () => {
    setCapturedImage(null);
    setStream(null); // This will trigger the useEffect to get the stream again
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-primary rounded-lg w-full max-w-lg mx-auto p-4 relative border border-secondary">
        <button onClick={onClose} className="absolute top-2 right-2 text-muted hover:text-light text-3xl font-bold">&times;</button>
        <h2 className="text-xl font-bold text-center mb-4 text-light">Take Photo</h2>
        
        {error && <div className="text-danger text-center mb-4">{error}</div>}

        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            ) : (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="mt-4 flex justify-center space-x-4">
            {capturedImage ? (
                <>
                    <button onClick={handleRetake} className="bg-secondary hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
                        Retake
                    </button>
                    <button onClick={handleUsePhoto} className="bg-accent-violet hover:bg-violet-500 text-white font-bold py-2 px-6 rounded-lg">
                        Use Photo
                    </button>
                </>
            ) : (
                <button onClick={handleCapture} disabled={!stream} className="bg-accent-violet hover:bg-violet-500 text-white font-bold py-3 px-6 rounded-full disabled:bg-muted">
                    Capture
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;