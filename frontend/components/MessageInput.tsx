import React, { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import SendIcon from './icons/SendIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import MicIcon from './icons/MicIcon';
import CameraIcon from './icons/CameraIcon';
import FileIcon from './icons/FileIcon';
import TrashIcon from './icons/TrashIcon';
import { useAudioRecorder, AudioResult } from '../hooks/useAudioRecorder';
import { useFileUpload, FileData } from '../hooks/useFileUpload';
import { Message } from '../types';
import AudioPlayer from './AudioPlayer';

// Helper function to get file extension from MIME type
const getExtensionFromMime = (mimeType: string): string => {
  const mimeMap: { [key: string]: string } = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
    'audio/aac': 'aac'
  };
  return mimeMap[mimeType] || 'audio';
};

interface MessageInputProps {
  onSendMessage: (message: Omit<Message, 'id' | 'role' | 'timestamp'>, attachments: FileData[]) => void;
  isLoading: boolean;
  onStopGenerating: () => void;
}

const AudioPreview: React.FC<{ audioResult: AudioResult; onDiscard: () => void; onSend: () => void; }> = ({ audioResult, onDiscard, onSend }) => {
  return (
    <div className="flex items-center gap-2 bg-primary/50 rounded-full p-2 w-full animate-fade-in">
      <button onClick={onDiscard} className="p-2 text-muted hover:text-danger rounded-full">
        <TrashIcon className="w-6 h-6 flex-shrink-0" />
      </button>
      
      <div className="flex-1">
        <AudioPlayer audioUrl={audioResult.url} />
      </div>

      <button onClick={onSend} className="p-3 text-white bg-accent rounded-full hover:bg-accent-dark">
        <SendIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, onStopGenerating }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { 
    status: recordingStatus, 
    startRecording, 
    stopRecording, 
    discardRecording, 
    audioResult, 
    error: audioError 
  } = useAudioRecorder();

  const { handleFileChange } = useFileUpload((fileData) => {
    setAttachments(prev => [...prev, fileData]);
  });

  const handleSend = () => {
    const allAttachments = attachments;
    if ((!text.trim() && allAttachments.length === 0) || isLoading) return;

    const messageContent = text.trim();
    
    const messageToSend: Omit<Message, 'id' | 'role' | 'timestamp'> = { 
      content: messageContent, 
      apiContent: messageContent 
    };
    
    if (messageToSend.content || allAttachments.length > 0) {
      onSendMessage(messageToSend, allAttachments);
    }

    setText('');
    setAttachments([]);
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
    if (audioError) discardRecording();
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleAttachmentClick = () => {
    if (audioError) discardRecording();
    fileInputRef.current?.click();
  }
  
  const handleCameraClick = async () => {
    if (audioError) discardRecording();
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        const content = `data:image/jpeg;base64,${image.base64String}`;
        const fileData: FileData = { name: `photo-${Date.now()}.jpg`, type: 'image', content, readable: false };
        console.log('📸 Camera photo captured:', { 
          name: fileData.name, 
          size: image.base64String.length,
          format: 'JPEG',
          quality: 90 
        });
        setAttachments(prev => [...prev, fileData]);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User cancelled photos app') {
        return; // Do nothing if user cancels
      }
      console.error('Camera error:', error);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="flex-shrink-0 p-2 md:p-4 bg-primary border-t border-secondary min-w-0 w-full max-w-full">
        {audioError && (
          <div className="bg-danger/20 border border-danger/50 text-red-300 text-sm p-3 rounded-lg mb-2 flex justify-between items-center" role="alert">
            <span>{audioError}</span>
            <button onClick={() => discardRecording()} className="font-bold text-lg leading-none p-1 hover:text-red-100" aria-label="Dismiss error">&times;</button>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="p-2 mb-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {attachments.map((att, index) => (
              <div key={index} className="relative group aspect-square bg-secondary rounded-lg animate-fade-in-up">
                {att.type === 'image' ? (
                  <img src={att.content} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted p-2">
                    <FileIcon className="w-8 h-8"/>
                    <span className="text-xs text-center truncate w-full mt-1">{att.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(index)} 
                  className="absolute -top-1 -right-1 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove attachment"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-secondary rounded-xl p-2 min-w-0 w-full max-w-full">
          <button
              onClick={handleCameraClick}
              className="p-2 text-muted hover:text-accent rounded-full hover:bg-primary disabled:opacity-50"
              disabled={isLoading}
              aria-label="Take photo"
          >
            <CameraIcon className="w-6 h-6" />
          </button>
          <button
              onClick={handleAttachmentClick}
              className="p-2 text-muted hover:text-accent rounded-full hover:bg-primary disabled:opacity-50"
              disabled={isLoading}
              aria-label="Attach file"
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,audio/*,text/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.rtf"
              multiple
          />

          {recordingStatus === 'recorded' && audioResult ? (
            <AudioPreview 
              audioResult={audioResult} 
              onDiscard={discardRecording} 
              onSend={() => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const extension = getExtensionFromMime(audioResult.mimeType);
                  const fileData: FileData = { 
                    name: `voice-message-${Date.now()}.${extension}`, 
                    type: 'audio', 
                    content: e.target?.result as string, 
                    readable: false 
                  };
                  console.log('🎵 Audio message created:', { 
                    name: fileData.name, 
                    mimeType: audioResult.mimeType,
                    duration: audioResult.duration,
                    size: audioResult.blob.size 
                  });
                  const allAttachments = [...attachments, fileData];
                  const messageToSend: Omit<Message, 'id' | 'role' | 'timestamp'> = {
                    content: text.trim(),
                  };
                  onSendMessage(messageToSend, allAttachments);
                  setText('');
                  setAttachments([]);
                  discardRecording();
                };
                reader.readAsDataURL(audioResult.blob);
              }}
            />
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 bg-transparent text-light placeholder-muted focus:outline-none resize-none max-h-48 py-2 min-w-0"
                disabled={isLoading || recordingStatus === 'recording'}
              />
              
              {isLoading ? (
                <button
                  onClick={onStopGenerating}
                  className="bg-danger text-white p-2 rounded-full hover:bg-red-500 animate-fade-in"
                  aria-label="Stop generating"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                  </svg>
                </button>
              ) : text.trim() || attachments.length > 0 ? (
                <button
                  onClick={handleSend}
                  className="bg-accent text-white p-2 rounded-full hover:bg-accent-dark disabled:opacity-50 disabled:hover:bg-accent animate-fade-in"
                  disabled={isLoading}
                  aria-label="Send message"
                >
                  <SendIcon className="w-6 h-6" />
                </button>
              ) : (
                <button 
                    onClick={recordingStatus === 'recording' ? stopRecording : startRecording} 
                    className={`p-2 rounded-full hover:bg-primary disabled:opacity-50 animate-fade-in ${recordingStatus === 'recording' ? 'text-accent recording-animation' : 'text-muted hover:text-accent'}`}
                    disabled={isLoading || attachments.length > 0}
                    aria-label={recordingStatus === 'recording' ? 'Stop recording' : 'Start recording'}
                >
                  <MicIcon className="w-6 h-6" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageInput;