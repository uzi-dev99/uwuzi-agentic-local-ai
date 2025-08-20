// Backend Service para comunicación con el agente enrutador
// Este servicio reemplaza la comunicación directa con Gemini

import { Message, UserRole } from '../types';

export interface BackendMessage {
  role: string;
  content: string;
}

/**
 * Invoca el agente del backend y maneja la respuesta en streaming
 * @param messages - Array de mensajes del chat
 * @param onChunk - Callback que se ejecuta por cada chunk recibido
 * @param onError - Callback que se ejecuta en caso de error
 */
interface InvokeDirectChatParams {
  messages: Message[];
  files: File[];
  onComplete: (response: { content: string }) => void;
  onError: (error: Error) => void;
  signal: AbortSignal;
}

export async function invokeDirectChat({
  messages,
  files,
  onComplete,
  onError,
  signal,
}: InvokeDirectChatParams): Promise<void> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('VITE_BACKEND_API_URL no está configurada');
    }

    const backendMessages: BackendMessage[] = messages.map(msg => ({
      role: msg.role === UserRole.USER ? 'user' : 'assistant',
      content: msg.apiContent || msg.content
    }));

    const fullUrl = `${backendUrl}/chat/direct`;
    let response;

    if (files.length > 0) {
      const formData = new FormData();
      formData.append('messages', JSON.stringify(backendMessages));
      files.forEach(file => {
        formData.append('files', file, file.name);
      });
      response = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        signal,
      });
    } else {
      response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: backendMessages }),
        signal,
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error del servidor: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    // La respuesta ya no es un stream, es un único JSON
    const responseData = await response.json();

    // El backend ahora devuelve la respuesta completa en el campo 'content'
    if (responseData && typeof responseData.content === 'string') {
      onComplete(responseData);
    } else {
      // Manejar el caso de que la respuesta no tenga el formato esperado
      throw new Error('La respuesta del servidor no tiene el formato esperado.');
    }

  } catch (error) {
    console.error('Error en invokeDirectChat:', error);
    onError(error instanceof Error ? error : new Error('Error desconocido'));
  }
}

// Nueva firma no-stream para invokeAgent con soporte de archivos (JSON con Base64)
interface InvokeAgentParams {
  messages: Message[];
  files: File[];
  onComplete: (response: { content: string }) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

/**
 * Convierte un objeto File a una cadena de datos URL en Base64.
 * @param file - El archivo a convertir.
 * @returns Una promesa que se resuelve con la cadena de datos URL.
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function invokeAgent({
  messages,
  files,
  onComplete,
  onError,
  signal,
}: InvokeAgentParams): Promise<void> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL;

    if (!backendUrl) {
      throw new Error('VITE_BACKEND_API_URL no está configurada en las variables de entorno');
    }

    const backendMessages: BackendMessage[] = messages.map(msg => ({
      role: msg.role === UserRole.USER ? 'user' : 'assistant',
      content: msg.apiContent || msg.content
    }));

    // Convertir archivos a formato de datos URL (Base64)
    const fileUploads = await Promise.all(
      files.map(async (file) => {
        const fileData = await fileToDataUrl(file);
        return {
          filename: file.name,
          content_type: file.type,
          file_data: fileData,
        };
      })
    );

    const fullUrl = `${backendUrl}/agent/invoke`;
    
    const payload = {
      messages: backendMessages,
      file_uploads: fileUploads,
    };

    console.log(`🚀 Sending JSON request with ${fileUploads.length} files (Base64 encoded) to:`, fullUrl);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error del servidor: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const responseData = await response.json();

    if (responseData && typeof responseData.content === 'string') {
      onComplete(responseData);
    } else {
      onComplete({ content: JSON.stringify(responseData) });
    }
  } catch (error) {
    console.error('Error en invokeAgent:', error);
    onError(error instanceof Error ? error : new Error('Error desconocido'));
  }
}

/**
 * Función auxiliar para validar la configuración del backend
 */
export function validateBackendConfig(): boolean {
  const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
  return !!backendUrl;
}

/**
 * Obtiene la URL configurada del backend
 */
export function getBackendUrl(): string | undefined {
  return import.meta.env.VITE_BACKEND_API_URL;
}