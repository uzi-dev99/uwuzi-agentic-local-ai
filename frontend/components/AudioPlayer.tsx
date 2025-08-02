import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setProgress(audio.currentTime);
    const setAudioPlaying = () => setIsPlaying(!audio.paused);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', setAudioPlaying);
    audio.addEventListener('pause', setAudioPlaying);
    audio.addEventListener('ended', setAudioPlaying);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', setAudioPlaying);
      audio.removeEventListener('pause', setAudioPlaying);
      audio.removeEventListener('ended', setAudioPlaying);
    };
  }, []);

  return (
    <div className="bg-primary/50 rounded-full p-2 flex items-center gap-2 w-full max-w-sm">
      <audio ref={audioRef} src={audioUrl} className="hidden" onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)} />

      <button onClick={handlePlayPause} className="p-2 text-light rounded-full focus:outline-none focus:ring-2 focus:ring-accent">
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm9 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.28 20.99c-1.25.717-2.779-.216-2.779-1.643V5.653Z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex items-center gap-3">
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-accent h-2 rounded-full"
            style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="text-xs text-muted w-12 font-mono whitespace-nowrap">
          {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;