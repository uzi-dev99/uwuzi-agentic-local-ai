import type { Chat, Folder, Message, StoredAttachment } from '@/types/chat';

// Ensure VITE_API_BASE_URL is defined in your .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getChatsKey = (userId: string) => `wuzi-chats-${userId}`;
const getFoldersKey = (userId: string) => `wuzi-folders-${userId}`;

// Simula un retraso de red para emular un backend real
const apiDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

const serializeAttachments = (messages: Message[]): Message[] => {
  return messages.map(msg => {
    if (!msg.attachments || msg.attachments.length === 0) {
      return msg;
    }
    const serializableAttachments = msg.attachments.map(att => {
      if (att instanceof File) {
        return { name: att.name, type: att.type, size: att.size } as StoredAttachment;
      }
      return att;
    });
    return { ...msg, attachments: serializableAttachments };
  });
};

export const fetchChats = async (userId: string): Promise<Chat[]> => {
  await apiDelay(300);
  console.log(`[API MOCK] Fetching all chats for user ${userId}`);
  const chatsKey = getChatsKey(userId);
  const chats = JSON.parse(localStorage.getItem(chatsKey) || '[]') as Chat[];
  return chats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchChat = async (chatId: string, userId: string): Promise<Chat | null> => {
    await apiDelay(200);
    console.log(`[API MOCK] Fetching chat ${chatId} for user ${userId}`);
    const chats = await fetchChats(userId);
    const chat = chats.find(c => c.id === chatId);
    return chat || null;
};

interface UpdateChatPayload {
    chatId: string;
    userId: string;
    folderId?: string | null;
    messages?: Message[];
    mode?: 'chat' | 'agent';
    isWaitingLongResponse?: boolean;
    title?: string;
    tags?: string[];
}

export const updateChat = async (payload: {
    chatId: string;
    userId: string;
    messages?: Message[];
    [key: string]: any;
}): Promise<Chat> => {
    await apiDelay(100);
    console.log(`[API MOCK] Persistiendo chat ${payload.chatId}`);
    const chatsKey = getChatsKey(payload.userId);
    const allChats = JSON.parse(localStorage.getItem(chatsKey) || '[]') as Chat[];
    const chatIndex = allChats.findIndex(chat => chat.id === payload.chatId);

    // --- LÓGICA PARA LIMPIAR DATOS DE IMAGEN ANTES DE GUARDAR ---
    let messagesToStore: Message[] | undefined = undefined;
    if (payload.messages) {
        messagesToStore = payload.messages.map(message => {
            if (!message.attachments || message.attachments.length === 0) {
                return message;
            }
            
            const serializableAttachments = message.attachments.map(att => {
                // Solo eliminamos 'data' si existe (adjuntos enriquecidos en memoria)
                if (att && typeof att === 'object' && 'data' in att) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { data, ...metadata } = att as any;
                  return metadata;
                }
                return att;
            });

            return { ...message, attachments: serializableAttachments };
        });
    }
    // --- FIN DE LA LÓGICA DE LIMPIEZA ---

    let updatedChat: Chat;

    if (chatIndex >= 0) {
        const existingChat = allChats[chatIndex];
        updatedChat = {
            ...existingChat,
            ...payload,
            messages: messagesToStore || existingChat.messages, // Usa los mensajes limpios
            createdAt: new Date().toISOString(),
        };
        allChats[chatIndex] = updatedChat;
    } else {
        const newTitle = payload.title || (payload.messages && payload.messages.length > 0
            ? payload.messages[0].text.slice(0, 30) + (payload.messages[0].text.length > 30 ? '...' : '')
            : 'Nuevo Chat');
        
        updatedChat = {
            id: payload.chatId,
            title: newTitle,
            messages: messagesToStore || [], // Usa los mensajes limpios
            createdAt: new Date().toISOString(),
            mode: payload.mode || 'chat',
            tags: payload.tags || [],
            folderId: payload.folderId,
        };
        allChats.push(updatedChat);
    }
    
    try {
        localStorage.setItem(chatsKey, JSON.stringify(allChats));
    } catch (e) {
        console.error("Error guardando en localStorage, probablemente por tamaño. Se omitieron los datos de imagen.", e);
        // Opcional: Podrías intentar guardar de nuevo sin ningún adjunto si falla
    }
    
    return updatedChat;
};

export const deleteChat = async ({ chatId, userId }: { chatId: string, userId: string }): Promise<void> => {
    await apiDelay(300);
    console.log(`[API MOCK] Deleting chat ${chatId} for user ${userId}`);
    const chatsKey = getChatsKey(userId);
    let chats = JSON.parse(localStorage.getItem(chatsKey) || '[]') as Chat[];
    chats = chats.filter(chat => chat.id !== chatId);
    localStorage.setItem(chatsKey, JSON.stringify(chats));
};

export const fetchFolders = async (userId: string): Promise<Folder[]> => {
    await apiDelay(100);
    const foldersKey = getFoldersKey(userId);
    console.log(`[API MOCK] Fetching folders for user ${userId}`);
    const savedFolders = JSON.parse(localStorage.getItem(foldersKey) || '[]') as Folder[];
    
    // Si no hay carpetas, creamos unas de ejemplo (lógica similar a la anterior)
    if (savedFolders.length === 0 && (JSON.parse(localStorage.getItem(getChatsKey(userId)) || '[]')).length > 0) {
        const mockFolders: Folder[] = [
            { id: '1', name: 'Trabajo' },
            { id: '2', name: 'Personal' },
        ];
        localStorage.setItem(foldersKey, JSON.stringify(mockFolders));
        return mockFolders;
    }
    return savedFolders;
};

export const createFolder = async ({ name, userId }: { name: string, userId: string }): Promise<Folder> => {
    await apiDelay(200);
    console.log(`[API MOCK] Creating folder "${name}" for user ${userId}`);
    const foldersKey = getFoldersKey(userId);
    const folders = JSON.parse(localStorage.getItem(foldersKey) || '[]') as Folder[];
    const newFolder: Folder = { id: Date.now().toString(), name };
    const updatedFolders = [...folders, newFolder];
    localStorage.setItem(foldersKey, JSON.stringify(updatedFolders));
    return newFolder;
};

export const deleteFolder = async ({ folderId, userId }: { folderId: string, userId: string }): Promise<void> => {
    await apiDelay(400);
    console.log(`[API MOCK] Deleting folder ${folderId} for user ${userId}`);
    const foldersKey = getFoldersKey(userId);
    const folders = JSON.parse(localStorage.getItem(foldersKey) || '[]') as Folder[];
    const updatedFolders = folders.filter(f => f.id !== folderId);
    localStorage.setItem(foldersKey, JSON.stringify(updatedFolders));

    const chatsKey = getChatsKey(userId);
    const chats = JSON.parse(localStorage.getItem(chatsKey) || '[]') as Chat[];
    const updatedChats = chats.map(chat => {
        if (chat.folderId === folderId) {
            const { folderId: _removed, ...rest } = chat;
            return rest as Chat;
        }
        return chat;
    });
    localStorage.setItem(chatsKey, JSON.stringify(updatedChats));
};

// Helper para convertir un File a Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Devuelve solo la parte de datos base64, sin el prefijo "data:image/png;base64,"
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export const sendDirectChatMessage = async (
    currentMessage: string,
    history: Message[],
    attachments: any[] // Ahora recibe los adjuntos ya procesados
): Promise<AsyncIterable<string>> => {
    const API_BASE_URL = localStorage.getItem('wuzi-assist-api-url') || import.meta.env.VITE_API_BASE_URL;
    const API_KEY = localStorage.getItem('wuzi-assist-api-key') || '';
    const model = localStorage.getItem('wuzi-assist-ollama-model') || 'gemma3:12b';
    const tempString = localStorage.getItem('wuzi-assist-ollama-temp');
    const temperature = tempString ? parseFloat(tempString) : 0.7;

    if (!API_BASE_URL) {
        throw new Error("La URL de la API no está configurada.");
    }

    // Prepara el historial para la API
    const apiHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));

    // Filtramos solo los que son imágenes y extraemos solo el string base64
    const imageAttachmentsForApi = attachments
        .filter(att => att.type.startsWith('image/') && att.data)
        .map(att => att.data.split(',')[1]); // Extraemos solo el base64

    const payload = {
        message: currentMessage,
        history: apiHistory,
        model: model,
        temperature: temperature,
        images: imageAttachmentsForApi // La clave que espera el backend
    };

    const response = await fetch(`${API_BASE_URL}/direct_chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': API_KEY,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en la respuesta del servidor');
    }

    if (!response.body) {
        throw new Error("La respuesta del streaming no tiene cuerpo.");
    }
    
    // Devolvemos el generador asíncrono para manejar el stream en el hook
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return {
      async *[Symbol.asyncIterator]() {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          yield decoder.decode(value);
        }
      }
    };
};
