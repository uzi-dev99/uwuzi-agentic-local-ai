
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 w-full max-w-[80%] my-2 mr-auto flex-row animate-fade-in">
      <Avatar className="flex-shrink-0">
        <AvatarImage src="/placeholder.svg" />
        <AvatarFallback>B</AvatarFallback>
      </Avatar>
      <div className="bg-secondary text-secondary-foreground rounded-2xl p-3 rounded-bl-none">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
