'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

type AudioMessageProps = {
  audioUrl: string;
  duration: number;
  isUser: boolean;
};

export default function AudioMessage({ audioUrl, duration, isUser }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      setHasError(true);
      return;
    }

    // Reset error state when audioUrl changes
    setHasError(false);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('Error loading audio:', e);
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const handlePlayPause = async () => {
    if (!audioRef.current || !audioUrl || hasError) return;

    try {
      // Verificar que la URL del blob sea válida
      if (audioUrl.startsWith('blob:')) {
        const response = await fetch(audioUrl);
        if (!response.ok) {
          console.error('Audio blob no disponible:', audioUrl);
          setHasError(true);
          return;
        }
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setHasError(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const bubbleClasses = isUser
    ? "bg-blue-500 text-white self-end"
    : "bg-gray-200 text-gray-800 self-start";

  const containerClasses = isUser ? "justify-end" : "justify-start";

  if (hasError || !audioUrl) {
    return (
      <div className={`flex items-start my-2 sm:my-3 ${containerClasses}`}>
        <div className={`flex items-start gap-2 sm:gap-3 max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%]`}>
          {!isUser && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
          )}
          
          <div className={`p-3 sm:p-4 rounded-2xl ${bubbleClasses} min-w-[200px]`}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-red-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              
              <div className="flex-1">
                <div className="text-xs opacity-75 mb-1">
                  ❌ Audio no disponible
                </div>
                <div className="text-xs opacity-60">
                  El archivo de audio no se pudo cargar
                </div>
              </div>
            </div>
          </div>
          
          {isUser && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-300 flex-shrink-0"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start my-2 sm:my-3 ${containerClasses}`}>
      <div className={`flex items-start gap-2 sm:gap-3 max-w-[95%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%]`}>
        {!isUser && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
        )}
        
        <div className={`p-3 sm:p-4 rounded-2xl ${bubbleClasses} min-w-[200px]`}>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              disabled={hasError}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                isUser 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700 disabled:bg-gray-200'
              }`}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs opacity-75">
                  🎵 Audio
                </span>
                <span className="text-xs opacity-75">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <div className={`h-1 rounded-full overflow-hidden ${
                isUser ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div
                  className={`h-full transition-all duration-100 ${
                    isUser ? 'bg-white' : 'bg-gray-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {isUser && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-300 flex-shrink-0"></div>
        )}
      </div>
      
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
}