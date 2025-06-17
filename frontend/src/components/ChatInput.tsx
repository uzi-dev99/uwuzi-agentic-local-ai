
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Mic, MicOff, Send, X, Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CameraCapture from './CameraCapture';

interface ChatInputProps {
  onSendMessage: (message: string, attachments: File[]) => void;
  isSending: boolean;
  chatMode: 'chat' | 'agent';
  onChatModeChange: (mode: 'chat' | 'agent') => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending, chatMode, onChatModeChange }) => {
  const [message, setMessage] = React.useState('');
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = React.useState(false);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  React.useEffect(() => {
    const checkTouch = () => setIsTouchDevice(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    checkTouch();
    // Optionally, listen for changes if display setup might change dynamically, though less common
    // window.matchMedia('(hover: none) and (pointer: coarse)').addEventListener('change', checkTouch);
    // return () => window.matchMedia('(hover: none) and (pointer: coarse)').removeEventListener('change', checkTouch);
  }, []);

  React.useEffect(() => {
    // Create object URLs for new image attachments
    attachments.forEach(file => {
      if (file.type.startsWith('image/') && !imagePreviews[file.name]) {
        const url = URL.createObjectURL(file);
        setImagePreviews(prev => ({ ...prev, [file.name]: url }));
      }
    });

    // Clean up object URLs for removed attachments or on unmount
    const currentAttachmentNames = attachments.map(f => f.name);
    const urlsToRevoke = Object.keys(imagePreviews).filter(name => !currentAttachmentNames.includes(name));

    urlsToRevoke.forEach(name => {
      URL.revokeObjectURL(imagePreviews[name]);
      setImagePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[name];
        return newPreviews;
      });
    });

    // Cleanup all on unmount
    return () => {
      Object.values(imagePreviews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [attachments]); // Rerun when attachments change, imagePreviews itself is not a direct dependency here to avoid loops

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    if (isTouchDevice) {
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
      cameraInputRef.current?.click();
    } else {
      setIsCameraOpen(true);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const handleCaptureFromWebcam = (file: File) => {
    setAttachments(prev => [...prev, file]);
  };

  const handleRemoveAttachment = (fileToRemove: File) => {
    setAttachments(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleMicClick = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast({
        title: "Grabando...",
        description: "Presiona nuevamente para detener",
      });
      
      setTimeout(() => {
        setIsRecording(false);
        const audioBlob = new Blob(['audio data'], { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.wav`, { type: 'audio/wav' });
        setAttachments(prev => [...prev, audioFile]);
        toast({
          title: "Audio grabado",
          description: "Se ha añadido el audio a tus adjuntos",
        });
      }, 3000);
    } else {
      setIsRecording(false);
      toast({
        title: "Grabación detenida",
        description: "Audio guardado",
      });
    }
  };
  
  const handleSend = () => {
    if ((message.trim() === '' && attachments.length === 0) || isSending) return;
    onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-content">
        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div className="chat-input-attachments">
            <p className="text-sm font-medium mb-2 text-foreground">Adjuntos:</p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="chat-input-attachment-item relative group">
                  {file.type.startsWith('image/') && imagePreviews[file.name] ? (
                    <img
                      src={imagePreviews[file.name]}
                      alt={file.name}
                      className="h-16 w-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-16 w-16 flex flex-col items-center justify-center bg-muted rounded-md p-1">
                      <Paperclip className="h-6 w-6 mb-1" />
                      <span className="text-xs text-center truncate w-full">{file.name}</span>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-0 right-0 h-6 w-6 rounded-full bg-background/50 hover:bg-destructive/80 group-hover:opacity-100 opacity-0 transition-opacity"
                    onClick={() => handleRemoveAttachment(file)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {!file.type.startsWith('image/') && (
                     <div className="absolute bottom-0 left-0 right-0 text-xs text-center truncate px-1 py-0.5 bg-background/70">
                        {file.name}
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Hidden file inputs */}
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/*,audio/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <CameraCapture 
          open={isCameraOpen} 
          onOpenChange={setIsCameraOpen} 
          onCapture={handleCaptureFromWebcam} 
        />

        {/* Main Input Layout */}
        <div className="chat-input-main flex flex-col lg:flex-row items-end gap-3">

          {/* Controls Section */}
          <div className="chat-input-controls flex lg:flex-col gap-2 w-full lg:w-auto flex-row justify-between lg:justify-start">

            <div className="chat-select w-auto flex-1 lg:w-[130px]">
              <Select value={chatMode} onValueChange={onChatModeChange} disabled={isSending}>
                <SelectTrigger className="chat-input-select select-trigger">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent className="select-content chat-select-content">
                  <SelectItem value="chat" className="select-item">Chat</SelectItem>
                  <SelectItem value="agent" className="select-item">Agente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="chat-input-buttons flex items-center gap-1">
              <Button variant="primary-ghost" size="icon" onClick={handleAttachClick} disabled={isSending} className="chat-input-button h-10 w-10">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                variant="primary-ghost" 
                size="icon" 
                onClick={handleMicClick} 
                disabled={isSending}
                className={`chat-input-button h-10 w-10 ${isRecording ? "recording" : ""}`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button 
                variant="primary-ghost" 
                size="icon" 
                onClick={handleCameraClick} 
                disabled={isSending}
                className="chat-input-button h-10 w-10"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Textarea Section */}
          <div className="chat-input-textarea-container w-full lg:flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Escribe tu mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="chat-input-textarea"
              rows={1}
            />
          </div>
          
          {/* Send Button */}
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={isSending || (message.trim() === '' && attachments.length === 0)}
            className="chat-input-send-button bg-primary hover:bg-primary/90 text-primary-foreground w-full h-12 lg:h-[60px] lg:w-[60px] flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
