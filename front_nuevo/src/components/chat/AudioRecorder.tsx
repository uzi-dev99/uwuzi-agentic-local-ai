'use client';

import { useState } from 'react';
import { useAudioRecorder, AudioRecording } from '@/hooks/useAudioRecorder';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';

type AudioRecorderProps = {
  onSendAudio: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
};

export default function AudioRecorder({ onSendAudio, onCancel }: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    formatTime
  } = useAudioRecorder();
  
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success) {
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const handleStopRecording = async () => {
    const audioRecording = await stopRecording();
    if (audioRecording) {
      setRecording(audioRecording);
    }
  };

  const handlePlayPause = () => {
    if (!recording) return;

    if (!audioElement) {
      const audio = new Audio(recording.url);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSend = () => {
    if (recording) {
      onSendAudio(recording.url, recording.duration);
      // No revocar la URL aquí, solo limpiar el estado local
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      setRecording(null);
      setIsPlaying(false);
      onCancel();
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      cancelRecording();
    }
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }
    setRecording(null);
    setIsPlaying(false);
    onCancel();
  };

  const handleDelete = () => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }
    setRecording(null);
    setIsPlaying(false);
  };

  // Visualización de nivel de audio
  const audioLevelBars = Array.from({ length: 5 }, (_, i) => {
    const threshold = (i + 1) * 0.2;
    const isActive = audioLevel > threshold;
    return (
      <div
        key={i}
        className={`w-1 rounded-full transition-all duration-100 ${
          isActive ? 'bg-red-500' : 'bg-gray-300'
        }`}
        style={{
          height: `${8 + i * 4}px`
        }}
      />
    );
  });

  return (
    <div className="bg-background border-t border-border p-4">
      {!recording ? (
        // Interfaz de grabación
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : handleStartRecording}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                  isRecording
                    ? isPaused
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
              >
                {isRecording ? (
                  isPaused ? <Play size={20} /> : <Pause size={20} />
                ) : (
                  <Mic size={20} />
                )}
              </button>
              
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-1 h-6">
                    {audioLevelBars}
                  </div>
                  <span className="text-sm font-mono text-foreground">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {isRecording && (
                <button
                  onClick={handleStopRecording}
                  className="h-10 w-10 rounded-full bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center"
                >
                  <Square size={16} />
                </button>
              )}
              <button
                onClick={handleCancel}
                className="h-10 w-10 rounded-full bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {!isRecording && (
            <p className="text-sm text-muted-foreground text-center">
              Toca el micrófono para comenzar a grabar
            </p>
          )}
        </div>
      ) : (
        // Interfaz de reproducción y envío
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  Audio grabado
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(recording.duration)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={handleSend}
                className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Reproduce para escuchar tu grabación antes de enviar
          </p>
        </div>
      )}
    </div>
  );
}