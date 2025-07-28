import { useState, useRef, useCallback } from 'react';

type RecordingStatus = 'idle' | 'recording' | 'stopped';
type AudioResult = {
  audioUrl: string | null;
  audioBlob: Blob | null;
};

export const useAudioRecorder = (onRecordingComplete: (audio: AudioResult) => void) => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (status === 'recording') return;
    setError(null);

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
          setError('Microphone access is blocked. Please enable it in your browser settings for this site.');
          setStatus('idle');
          return;
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus('recording');
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        onRecordingComplete({ audioUrl, audioBlob });
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
        setStatus('stopped');
      };
      mediaRecorderRef.current.start();
    } catch (err) {
      console.error('Failed to get audio stream', err);
      setStatus('idle');
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setError('Microphone access was denied. To use this feature, please allow microphone access in your browser settings.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found. Please ensure a microphone is connected and try again.');
      } else {
        setError('An error occurred while trying to access the microphone.');
      }
    }
  }, [status, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (status !== 'recording' || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  }, [status]);
  
  const toggleRecording = useCallback(() => {
    if (status === 'recording') {
        stopRecording();
    } else {
        startRecording();
    }
  }, [status, startRecording, stopRecording]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { status, toggleRecording, error, clearError };
};
