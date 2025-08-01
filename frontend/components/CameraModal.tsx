import React, { useEffect, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface CameraModalProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri, // Use URI to handle large images better
        source: CameraSource.Camera,
      });

      if (image.webPath) {
        // Convert webPath to a data URL to display
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedImage(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }

    } catch (err) {
      // Handle error (e.g., user canceled the camera)
      if (err instanceof Error && err.message === 'User cancelled photos app') {
        // User cancelled, so just close the modal without an error message
        onClose();
        return;
      }
      console.error('Camera error:', err);
      setError('Could not take picture. Please try again.');
      // Close the modal on other errors too after a delay, or let the user close it
      setTimeout(() => onClose(), 2000); // Close after 2s to show the error
    }
  };

  useEffect(() => {
    // Automatically open the camera when the modal is rendered
    if (!capturedImage) {
      takePicture();
    }
  }, [capturedImage]);

  const handleRetake = () => {
    setCapturedImage(null); // This will trigger the useEffect to take a new picture
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
            <div className="w-full h-full flex items-center justify-center text-muted">
              Opening Camera...
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center space-x-4">
          {capturedImage && (
            <>
              <button onClick={handleRetake} className="bg-secondary hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
                Retake
              </button>
              <button onClick={handleUsePhoto} className="bg-accent-violet hover:bg-violet-500 text-white font-bold py-2 px-6 rounded-lg">
                Use Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

};

export default CameraModal;