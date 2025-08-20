import { useState, useCallback } from 'react';
import { VoiceRecorder, RecordingData } from 'capacitor-voice-recorder';

type RecordingStatus = 'idle' | 'recording' | 'recorded' | 'error';

export type AudioResult = {
  blob: Blob;
  url: string;
  mimeType: string;
  duration: number;
};

// Helper to convert base64 to Blob
const base64toBlob = (base64Data: string, contentType: string): Blob => {
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

export const useAudioRecorder = () => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    if (status === 'recording') return;
    setError(null);
    setAudioResult(null);

    try {
      const { status: currentStatus } = await VoiceRecorder.getCurrentStatus();
      if (currentStatus === 'RECORDING') {
        // Already recording, do nothing or handle as needed
        return;
      }

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
        setAudioResult({
          blob: audioBlob,
          url: audioUrl,
          mimeType: result.value.mimeType,
          duration: result.value.msDuration, // Corrected property
        });
        setStatus('recorded');
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setError('Could not stop recording. Please try again.');
      setStatus('idle');
    }
  }, [status]);

  const discardRecording = useCallback(() => {
    if (audioResult) {
      URL.revokeObjectURL(audioResult.url);
    }
    setAudioResult(null);
    setStatus('idle');
    setError(null);
  }, [audioResult]);

  return { status, startRecording, stopRecording, discardRecording, audioResult, error };
};
