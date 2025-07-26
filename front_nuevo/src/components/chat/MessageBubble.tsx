import AudioMessage from './AudioMessage';
import FileMessage from './FileMessage';
import MessageContent from './MessageContent';
import { Message } from '@/hooks/useChat';

type MessageBubbleProps = {
  message: Message;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.type === 'audio' && message.audioUrl && message.audioDuration) {
    return (
      <AudioMessage 
        audioUrl={message.audioUrl}
        duration={message.audioDuration}
        isUser={message.isUser}
      />
    );
  }

  if (message.type === 'file') {
    const containerClasses = message.isUser ? "justify-end" : "justify-start";
    
    return (
    <div className={`flex items-start my-2 sm:my-3 w-full ${containerClasses}`}>
      <div className={`flex items-start gap-2 sm:gap-3 max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] min-w-0`}>
        {!message.isUser && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
        )}
        <div className="flex-1 min-w-0">
          <FileMessage message={message} />
        </div>
        {message.isUser && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-300 flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
  }

  // Mensaje de texto
  const bubbleClasses = message.isUser
    ? "bg-blue-500 text-white self-end"
    : "bg-gray-200 text-gray-800 self-start";

  const containerClasses = message.isUser ? "justify-end" : "justify-start";

  return (
    <div className={`flex items-start my-2 sm:my-3 w-full ${containerClasses}`}>
      <div className={`flex items-start gap-2 sm:gap-3 max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] min-w-0`}>
        {!message.isUser && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
        )}
        <div className={`p-3 sm:p-4 rounded-2xl min-w-0 ${bubbleClasses}`}>
          <MessageContent content={message.text || ''} isUser={message.isUser} />
        </div>
        {message.isUser && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-300 flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
}