import { useState, useCallback } from 'react';
import { VoiceRecorder, RecordingData } from 'capacitor-voice-recorder';

type RecordingStatus = 'idle' | 'recording' | 'stopped';
type AudioResult = {
  audioUrl: string | null;
  audioBlob: Blob | null;
};

// Helper to convert base64 to Blob
const base64toBlob = (base64Data: string, contentType: string) => {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
};

export const useAudioRecorder = (onRecordingComplete: (audio: AudioResult) => void) => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    if (status === 'recording') return;
    setError(null);

    try {
      const permission = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permission.value) {
        setError('Microphone access was denied. Please enable it in the app settings.');
        setStatus('idle');
        return;
      }

      await VoiceRecorder.startRecording();
      setStatus('recording');
    } catch (err) {
      console.error('Failed to start recording', err);
      setError('Could not start recording. Please try again.');
      setStatus('idle');
    }
  }, [status]);

  const stopRecording = useCallback(async () => {
    if (status !== 'recording') return;

    try {
      const result: RecordingData = await VoiceRecorder.stopRecording();
      if (result.value && result.value.recordDataBase64) {
        const audioBlob = base64toBlob(result.value.recordDataBase64, result.value.mimeType);
        const audioUrl = URL.createObjectURL(audioBlob);
        onRecordingComplete({ audioUrl, audioBlob });
      }
      setStatus('stopped');
    } catch (err) {
      console.error('Failed to stop recording', err);
      setError('Could not stop recording. Please try again.');
      setStatus('idle');
    }
  }, [status, onRecordingComplete]);

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
