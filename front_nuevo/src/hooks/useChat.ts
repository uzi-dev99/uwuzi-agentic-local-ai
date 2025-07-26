import { useState, ChangeEvent, FormEvent } from 'react';
import { useLocalStorage } from './useLocalStorage';

// Interfaz Message actualizada para soportar mensajes de audio y archivos
export interface Message {
  id: string;
  text?: string;
  isUser: boolean;
  type: 'text' | 'audio' | 'file';
  audioUrl?: string;
  audioDuration?: number;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileData?: string; // base64 o blob URL
}

export const useChat = (chatId?: string) => {
  // Usar chatId específico para el localStorage, o un valor por defecto
  const storageKey = chatId ? `chatMessages-${chatId}` : 'chatMessages';
  const [messages, setMessages] = useLocalStorage<Message[]>(storageKey, []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Limpiar URLs de blob obsoletas del localStorage al inicializar
  useState(() => {
    const cleanObsoleteBlobUrls = () => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chatMessages-')) {
          try {
            const storedMessages = JSON.parse(localStorage.getItem(key) || '[]') as Message[];
            const cleanedMessages = storedMessages.map(msg => {
              if (msg.type === 'audio' && msg.audioUrl && msg.audioUrl.includes('localhost:3000')) {
                // Remover URLs de blob obsoletas del puerto 3000
                return { ...msg, audioUrl: undefined };
              }
              return msg;
            });
            localStorage.setItem(key, JSON.stringify(cleanedMessages));
          } catch (error) {
            console.error('Error cleaning obsolete blob URLs:', error);
          }
        }
      }
    };
    cleanObsoleteBlobUrls();
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      isUser: true,
      type: 'text'
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simular respuesta del bot
    setTimeout(() => {
      const botMessage: Message = {
        id: crypto.randomUUID(),
        text: 'Esta es una respuesta automática.',
        isUser: false,
        type: 'text'
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const sendAudioMessage = (audioUrl: string, duration: number) => {
    const audioMessage: Message = {
      id: crypto.randomUUID(),
      isUser: true,
      type: 'audio',
      audioUrl,
      audioDuration: duration
    };

    setMessages(prevMessages => [...prevMessages, audioMessage]);
    setIsTyping(true);

    // Simular respuesta del bot
    setTimeout(() => {
      const botMessage: Message = {
        id: crypto.randomUUID(),
        text: 'He recibido tu mensaje de audio.',
        isUser: false,
        type: 'text'
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const sendFileMessage = (fileName: string, fileSize: number, fileType: string, fileData: string) => {
    const fileMessage: Message = {
      id: crypto.randomUUID(),
      isUser: true,
      type: 'file',
      fileName,
      fileSize,
      fileType,
      fileData
    };

    setMessages(prevMessages => [...prevMessages, fileMessage]);
    setIsTyping(true);

    // Simular respuesta del bot
    setTimeout(() => {
      const botMessage: Message = {
        id: crypto.randomUUID(),
        text: `He recibido tu archivo: ${fileName}`,
        isUser: false,
        type: 'text'
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return { messages, input, isTyping, handleInputChange, handleSubmit, sendAudioMessage, sendFileMessage };
};