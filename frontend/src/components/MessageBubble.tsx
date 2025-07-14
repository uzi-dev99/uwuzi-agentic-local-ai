import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Message } from '@/types/chat';
import { Bot, User, Copy, Check, Paperclip } from 'lucide-react'; // Added Paperclip
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import MarkdownRenderer from './MarkdownRenderer';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const { currentUser } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isCopied, setIsCopied] = React.useState(false);
  const [imageAttachmentPreviews, setImageAttachmentPreviews] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const newPreviews: Record<string, string> = {};
    let urlsCreated = false;

    if (message.attachments) {
      message.attachments.forEach(file => {
        // Ensure 'file' is a File object and not StoredAttachment from older mock data
        if (file instanceof File && file.type.startsWith('image/')) {
          if (!imageAttachmentPreviews[file.name]) { // Create only if not existing
            const url = URL.createObjectURL(file);
            newPreviews[file.name] = url;
            urlsCreated = true;
          } else {
            newPreviews[file.name] = imageAttachmentPreviews[file.name]; // Keep existing
          }
        }
      });
    }

    if (urlsCreated) {
       setImageAttachmentPreviews(prev => ({...prev, ...newPreviews}));
    }

    // Intelligent cleanup: revoke URLs that are no longer in message.attachments
    // or if message.attachments becomes undefined/empty
    const currentAttachmentFileNames = message.attachments && Array.isArray(message.attachments)
      ? message.attachments.filter(f => f instanceof File && f.type.startsWith('image/')).map(f => (f as File).name)
      : [];

    const urlsToRevoke = Object.keys(imageAttachmentPreviews).filter(name => !currentAttachmentFileNames.includes(name));

    if (urlsToRevoke.length > 0) {
      urlsToRevoke.forEach(name => URL.revokeObjectURL(imageAttachmentPreviews[name]));
      setImageAttachmentPreviews(prev => {
        const updatedPreviews = { ...prev };
        urlsToRevoke.forEach(name => delete updatedPreviews[name]);
        return updatedPreviews;
      });
    }

    // Cleanup all on unmount
    return () => {
      Object.values(imageAttachmentPreviews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [message.attachments]); // Dependency array

  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(message.text)
      .then(() => {
        toast.success("Markdown copiado al portapapeles");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        toast.error("No se pudo copiar el texto");
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className={cn(
      "flex items-start gap-2 sm:gap-3 w-full max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] my-2 sm:my-3 animate-fade-in",
      isUser ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
    )}>
      <Avatar className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8">
        <AvatarImage src={isUser ? currentUser?.avatar : ""} />
        <AvatarFallback className={cn(
          "text-xs",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "rounded-xl p-3 sm:p-4 group shadow-sm border min-w-0 flex-1 max-w-full message-bubble-content",
        isUser 
          ? "bg-primary text-primary-foreground rounded-br-none border-primary/20"
          : "bg-secondary text-secondary-foreground rounded-bl-none border-secondary/20"
      )}>
        <div className="message-text" style={{ 
          color: isUser 
            ? 'hsl(var(--primary-foreground)) !important' 
            : (resolvedTheme === 'dark' ? '#ffffff !important' : '#000000 !important')
        }}>
          <MarkdownRenderer content={message.text} theme={resolvedTheme} />
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 sm:mt-3 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
            {message.attachments.map((attachment, index) => {
              // Si es imagen en base64 (nuevo flujo)
              if (
                'data' in attachment &&
                typeof attachment.data === 'string' &&
                attachment.type &&
                attachment.type.startsWith('image/')
              ) {
                return (
                  <div key={index} className="rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={attachment.data}
                      alt={attachment.name}
                      className="w-full h-auto object-cover aspect-square"
                    />
                  </div>
                );
              }
              // Si es File (flujo antiguo, fallback)
              if (attachment instanceof File && attachment.type.startsWith('image/') && imageAttachmentPreviews[attachment.name]) {
                return (
                  <div key={index} className="rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={imageAttachmentPreviews[attachment.name]}
                      alt={attachment.name}
                      className="w-full h-auto object-cover aspect-square"
                    />
                  </div>
                );
              } else if (attachment instanceof File) {
                 return (
                    <div
                        key={index}
                        className={cn(
                        "rounded-lg p-3 text-xs border h-24 flex flex-col items-center justify-center",
                        isUser
                            ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                            : "bg-background/50 border-border/50 text-foreground"
                        )}
                    >
                        <Paperclip className="h-5 w-5 mb-1" />
                        <span className="font-medium truncate w-full text-center">{attachment.name}</span>
                        {attachment.size && (
                        <span className="opacity-70">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                        )}
                    </div>
                 );
              } else if ('name' in attachment) {
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg p-3 text-xs border h-24 flex flex-col items-center justify-center",
                      isUser
                        ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                        : "bg-background/50 border-border/50 text-foreground"
                    )}
                  >
                    <Paperclip className="h-5 w-5 mb-1" />
                    <span className="font-medium truncate w-full text-center">{attachment.name}</span>
                    {('size' in attachment && typeof attachment.size === 'number') && (
                      <span className="opacity-70">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2 sm:mt-3 pt-2 border-t border-border/20">
          <p className="text-xs font-medium message-timestamp">{message.timestamp}</p>
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-90 transition-opacity duration-200 copy-button"
              onClick={handleCopy}
              aria-label="Copiar markdown"
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
