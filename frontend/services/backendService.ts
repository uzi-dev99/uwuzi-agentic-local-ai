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
export async function invokeDirectChat(
  messages: Message[],
  files: File[],
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void,
  signal: AbortSignal
): Promise<void> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('VITE_BACKEND_API_URL no está configurada');
    }

    const formData = new FormData();
    const backendMessages: BackendMessage[] = messages.map(msg => ({
      role: msg.role === UserRole.USER ? 'user' : 'assistant',
      content: msg.apiContent || msg.content
    }));

    formData.append('messages', JSON.stringify(backendMessages));
    files.forEach(file => {
      formData.append('files', file);
    });

    const fullUrl = `${backendUrl}/chat/direct`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No se recibió cuerpo de respuesta del servidor');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        let braceCount = 0;
        let lastCut = 0;
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === '{') {
            braceCount++;
          } else if (buffer[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              const jsonStr = buffer.substring(lastCut, i + 1);
              if (jsonStr.trim()) {
                try {
                  const jsonChunk = JSON.parse(jsonStr);
                  if (jsonChunk.response) {
                    onChunk(jsonChunk.response);
                  }
                } catch (e) {
                  // Ignorar errores de parseo, puede ser un fragmento
                }
              }
              lastCut = i + 1;
            }
          }
        }
        if (lastCut > 0) {
          buffer = buffer.substring(lastCut);
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Error en invokeDirectChat:', error);
    onError(error instanceof Error ? error : new Error('Error desconocido'));
  }
}


export async function invokeAgent(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    // Obtener la URL del backend desde las variables de entorno
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
    
    console.log('=== FRONTEND DEBUG ==>');
    console.log('Backend URL:', backendUrl);
    console.log('Messages to send:', messages);
    
    if (!backendUrl) {
      throw new Error('VITE_BACKEND_API_URL no está configurada en las variables de entorno');
    }

    // Adaptar el formato de mensajes al que espera el backend
    const backendMessages: BackendMessage[] = messages.map(msg => ({
      role: msg.role === UserRole.USER ? 'user' : 'assistant',
      content: msg.apiContent || msg.content
    }));

    console.log('Backend messages formatted:', backendMessages);
    
    // Construir la URL completa del endpoint
    const fullUrl = `${backendUrl}/agent/invoke`; // Mantener para futura V2
    console.log('Full URL:', fullUrl);

    // Realizar la petición POST al endpoint del agente
    console.log('Making fetch request...');
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: backendMessages })
    });
    
    console.log('Response received:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No se recibió cuerpo de respuesta del servidor');
    }

    // Leer la respuesta como stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decodificar el chunk recibido
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Procesar los chunks de JSON delimitados por saltos de línea
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Guardar la línea incompleta para el siguiente chunk

        for (const line of lines) {
          if (line.trim()) {
            try {
              const jsonChunk = JSON.parse(line);
              
              // Extraer el contenido del chunk según el formato del backend
              if (jsonChunk.content) {
                onChunk(jsonChunk.content);
              } else if (typeof jsonChunk === 'string') {
                onChunk(jsonChunk);
              }
            } catch (parseError) {
              console.warn('Error al parsear chunk JSON:', parseError, 'Línea:', line);
              // Si no es JSON válido, tratar como texto plano
              onChunk(line);
            }
          }
        }
      }

      // Procesar cualquier contenido restante en el buffer
      if (buffer.trim()) {
        try {
          const jsonChunk = JSON.parse(buffer);
          if (jsonChunk.content) {
            onChunk(jsonChunk.content);
          } else if (typeof jsonChunk === 'string') {
            onChunk(jsonChunk);
          }
        } catch (parseError) {
          console.warn('Error al parsear último chunk:', parseError);
          onChunk(buffer);
        }
      }
    } finally {
      reader.releaseLock();
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