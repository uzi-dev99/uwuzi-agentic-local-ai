import { ChangeEvent, FormEvent, useState } from 'react';
import { Mic, Paperclip, X, Send, Camera } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import CameraCapture from '../CameraCapture';
import { useFileUpload, FileUploadResult } from '@/hooks/useFileUpload';
import { CameraCaptureResult } from '@/hooks/useCameraCapture';

type ChatInputProps = {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onSendAudio: (audioUrl: string, duration: number) => void;
  onSendFile: (fileName: string, fileSize: number, fileType: string, fileData: string) => void;
};

export default function ChatInput({ input, handleInputChange, handleSubmit, onSendAudio, onSendFile }: ChatInputProps) {
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileUploadResult | null>(null);
  const { isUploading, uploadProgress, fileInputRef, selectFile, allowedTypes, formatFileSize, getFileIcon } = useFileUpload();

  const handleAudioSend = (audioUrl: string, duration: number) => {
    onSendAudio(audioUrl, duration);
    setShowAudioRecorder(false);
  };

  const handleAudioCancel = () => {
    setShowAudioRecorder(false);
  };

  const handleFileSelect = async () => {
    try {
      const result = await selectFile();
      setSelectedFile(result);
    } catch (error) {
      console.error('Error seleccionando archivo:', error);
      // Aquí podrías mostrar un toast o mensaje de error
    }
  };

  const handleConfirmFile = () => {
    if (selectedFile) {
      // Enviar el archivo
      onSendFile(selectedFile.fileName, selectedFile.fileSize, selectedFile.fileType, selectedFile.fileData);
      
      // Si hay texto, enviarlo como mensaje separado
      if (input.trim()) {
        // Simular el envío del formulario para el mensaje de texto
        const syntheticEvent = new Event('submit') as unknown as FormEvent<HTMLFormElement>;
        handleSubmit(syntheticEvent);
      }
      
      setSelectedFile(null);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
  };

  const handleCameraCapture = (result: CameraCaptureResult) => {
    // Convertir el resultado de la cámara al formato esperado por onSendFile
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      onSendFile(result.file.name, result.file.size, result.file.type, base64Data);
    };
    reader.readAsDataURL(result.file);
    setShowCameraCapture(false);
  };

  const handleCameraClose = () => {
    setShowCameraCapture(false);
  };

  if (showAudioRecorder) {
    return (
      <AudioRecorder 
        onSendAudio={handleAudioSend}
        onCancel={handleAudioCancel}
      />
    );
  }

  if (showCameraCapture) {
    return (
      <CameraCapture 
        onCapture={handleCameraCapture}
        onClose={handleCameraClose}
      />
    );
  }

  // Mostrar previsualización del archivo seleccionado
  if (selectedFile) {
    return (
      <footer className="p-4 bg-background border-t border-border">
        <div className="bg-muted rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(selectedFile.fileType)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{selectedFile.fileName}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.fileSize)}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-3">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe un mensaje (opcional)..."
            className="flex-1 p-2.5 bg-input border border-border rounded-lg resize-none text-foreground"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleConfirmFile();
              }
            }}
          />
        </form>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancelFile}
            className="flex-1 p-2.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Cancelar
          </button>
          <button
            onClick={handleConfirmFile}
            className="flex-1 p-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Enviar
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="p-4 bg-background border-t border-border">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <button 
          type="button" 
          onClick={handleFileSelect}
          disabled={isUploading}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed relative"
          title="Adjuntar archivo"
        >
          {isUploading ? (
            <div className="relative">
              <Paperclip size={20} className="opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <Paperclip size={20} />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes}
            className="hidden"
          />
        </button>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe tu mensaje..."
          className="flex-1 p-2.5 bg-input border border-border rounded-lg resize-none text-foreground"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              // The form's onSubmit will handle the submission
              (e.target as HTMLTextAreaElement).form?.requestSubmit();
            }
          }}
        />
        <button 
          type="button" 
          onClick={() => setShowCameraCapture(true)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Capturar imagen"
        >
          <Camera size={20} />
        </button>
        <button 
          type="button" 
          onClick={() => setShowAudioRecorder(true)}
          className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
        >
          <Mic size={20} />
        </button>
        <button type="submit" className="p-2.5 bg-primary text-primary-foreground rounded-full disabled:opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </footer>
  );
}