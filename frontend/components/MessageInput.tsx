import React, { useState, useRef, useCallback } from 'react';
import SendIcon from './icons/SendIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import MicIcon from './icons/MicIcon';
import CameraIcon from './icons/CameraIcon';
import FileIcon from './icons/FileIcon';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useFileUpload, FileData } from '../hooks/useFileUpload';
import CameraModal from './CameraModal';
import { Message } from '../types';

interface MessageInputProps {
  onSendMessage: (message: Omit<Message, 'id' | 'role' | 'timestamp'>, attachments: File[]) => void;
  isLoading: boolean;
  onStopGenerating: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, onStopGenerating }) => {
  const [text, setText] = useState('');
  const [isCameraOpen, setCameraOpen] = useState(false);
  const [attachment, setAttachment] = useState<{ data: FileData; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAudioComplete = useCallback((result: { audioUrl: string | null; audioBlob: Blob | null }) => {
    if(result.audioUrl) {
        onSendMessage({ content: `(Voice message was recorded, but audio sending is not implemented yet.)` }, []);
    }
  }, [onSendMessage]);

  const { status: recordingStatus, toggleRecording, error: audioError, clearError: clearAudioError } = useAudioRecorder(handleAudioComplete);

    const handleFileSelect = (fileData: FileData, file: File) => {
    setAttachment({ data: fileData, file });
  };

  const handlePhotoCapture = (dataUrl: string) => {
    // Esto es para la cámara, que ya envía un data URL. No hay un objeto File aquí.
    // La lógica del backend deberá poder manejar un base64 directamente en el contenido.
    // Por ahora, lo dejamos así, ya que el plan se centra en la carga de archivos.
    onSendMessage({ content: dataUrl, apiContent: dataUrl }, []);
    setCameraOpen(false);
  }
  
  const { handleFileChange } = useFileUpload(handleFileSelect);

  const handleSend = () => {
    if ((!text.trim() && !attachment) || isLoading) return;

    let messageToSend: Omit<Message, 'id' | 'role' | 'timestamp'>;

    if (attachment) {
      if (attachment.data.type === 'image') {
        // For images, the content itself is the data URL. Text is ignored when sending an image this way.
        messageToSend = { content: attachment.data.content, apiContent: attachment.data.content };
      } else {
        const displayContent = `(File Attached: ${attachment.data.name})\n${text.trim()}`.trim();
        let apiContent: string;
        if (attachment.data.readable) {
          apiContent = `Attached file "${attachment.data.name}":\n\n${attachment.data.content}\n\n---\n\n${text.trim()}`.trim();
        } else {
          apiContent = `(Se adjuntó un archivo no legible: ${attachment.data.name})\n\n${text.trim()}`.trim();
        }
        messageToSend = { content: displayContent, apiContent };
      }
    } else {
      messageToSend = { content: text.trim(), apiContent: text.trim() };
    }
    
        if (messageToSend.content) {
      onSendMessage(messageToSend, attachment ? [attachment.file] : []);
    }

    setText('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (audioError) clearAudioError();
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleAttachmentClick = () => {
    if (audioError) clearAudioError();
    fileInputRef.current?.click();
  }
  
  const handleCameraClick = () => {
    if (audioError) clearAudioError();
    setCameraOpen(true);
  }

  return (
    <>
      {isCameraOpen && <CameraModal onCapture={handlePhotoCapture} onClose={() => setCameraOpen(false)} />}
      <div className="flex-shrink-0 p-2 md:p-4 bg-primary border-t border-secondary">
        {audioError && (
          <div className="bg-danger/20 border border-danger/50 text-red-300 text-sm p-3 rounded-lg mb-2 flex justify-between items-center" role="alert">
            <span>{audioError}</span>
            <button onClick={clearAudioError} className="font-bold text-lg leading-none p-1 hover:text-red-100" aria-label="Dismiss error">&times;</button>
          </div>
        )}

        {attachment && (
            <div className="bg-secondary p-2 rounded-lg mb-2 flex justify-between items-center animate-fade-in-up">
                <div className="flex items-center gap-2 min-w-0">
                    {attachment.data.type === 'image' 
                        ? <img src={attachment.data.content} className="w-8 h-8 rounded object-cover" />
                        : <FileIcon className="w-5 h-5 text-muted flex-shrink-0"/>
                    }
                    <span className="text-sm text-light truncate">{attachment.data.name}</span>
                </div>
                <button onClick={() => setAttachment(null)} className="font-bold text-lg leading-none p-1 text-muted hover:text-light" aria-label="Remove attachment">&times;</button>
            </div>
        )}

        <div className="flex items-end gap-2 bg-secondary rounded-xl p-2">
          <button
              onClick={handleCameraClick}
              className="p-2 text-muted hover:text-accent-violet rounded-full hover:bg-primary disabled:opacity-50"
              disabled={isLoading || !!attachment}
              aria-label="Take photo"
          >
            <CameraIcon className="w-6 h-6" />
          </button>
          <button
              onClick={handleAttachmentClick}
              className="p-2 text-muted hover:text-accent-violet rounded-full hover:bg-primary disabled:opacity-50"
              disabled={isLoading || !!attachment}
              aria-label="Attach file"
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,text/plain,text/markdown,.pdf,.txt,.md"
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-light placeholder-muted focus:outline-none resize-none max-h-48 py-2"
            disabled={isLoading}
          />
          
          <button 
              onClick={toggleRecording} 
              className={`p-2 rounded-full hover:bg-primary disabled:opacity-50 ${recordingStatus === 'recording' ? 'text-accent-violet animate-pulse' : 'text-muted hover:text-accent-violet'}`}
              disabled={isLoading || !!attachment}
              aria-label={recordingStatus === 'recording' ? 'Stop recording' : 'Start recording'}
          >
            <MicIcon className="w-6 h-6" />
          </button>

          {isLoading ? (
            <button
              onClick={onStopGenerating}
              className="bg-danger text-white p-2 rounded-full hover:bg-red-500"
              aria-label="Stop generating"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim() && !attachment}
              className="bg-accent-violet text-white p-2 rounded-full hover:bg-violet-500 disabled:bg-muted disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageInput;