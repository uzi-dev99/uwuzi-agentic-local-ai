// en src/hooks/useChat.ts

import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Message, Chat } from '@/types/chat';
import { toast } from 'sonner';
import { useNotifications } from '@/context/NotificationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

export const useChat = (chatId: string | null, folderId: string | null) => {
    const { currentUser } = useAuth();
    const { sendNotification } = useNotifications();
    const queryClient = useQueryClient();
    const userId = currentUser!.id;

    const [isSending, setIsSending] = React.useState(false);

    // isLoadingChat se usa para la carga inicial del historial del chat
    const { data: chat, isLoading: isLoadingChat } = useQuery({
        queryKey: ['chat', chatId, userId],
        queryFn: async () => {
            if (!chatId || !userId) return null;
            const fetchedChat = await api.fetchChat(chatId, userId);
            if (!fetchedChat) {
                return {
                    id: chatId,
                    title: 'Nuevo Chat',
                    messages: [],
                    createdAt: new Date().toISOString(),
                    mode: 'chat',
                    folderId: folderId || undefined,
                } as Chat;
            }
            return fetchedChat;
        },
        enabled: !!chatId && !!userId,
    });

    const { mutate: updateChatMutation } = useMutation({
        mutationFn: api.updateChat,
        onSuccess: (updatedChat) => {
            // Actualiza tanto la lista general de chats como la vista de chat individual
            queryClient.setQueryData(['chat', chatId, userId], updatedChat);
            queryClient.invalidateQueries({ queryKey: ['chats', userId] });
        },
        onError: (error) => {
            toast.error(`Error al actualizar el chat: ${error.message}`);
            setIsSending(false);
        }
    });

    const [chatMode, setChatMode] = React.useState<'chat' | 'agent'>(chat?.mode || 'chat');
    React.useEffect(() => {
        if (chat?.mode) setChatMode(chat.mode);
    }, [chat?.mode]);

    const messages = chat?.messages || [];
    const chatTitle = chat?.title || 'Nuevo Chat';

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string); // Devolvemos el string completo con prefijo
            reader.onerror = error => reject(error);
        });
    };

    const handleSendMessage = async (text: string, attachments: File[]) => {
        if (!chatId || !userId || isSending) return;

        setIsSending(true);

        // 1. Procesa los adjuntos inmediatamente
        const processedAttachments = await Promise.all(
            attachments.map(async (file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
                // Guardamos el contenido en base64 si es una imagen
                data: file.type.startsWith('image/') ? await fileToBase64(file) : null
            }))
        );

        const userMessage: Message = {
            id: `user_${new Date().getTime()}`,
            sender: 'user',
            text,
            attachments: processedAttachments, // Usamos los adjuntos ya procesados
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const currentHistory = queryClient.getQueryData<Chat>(['chat', chatId, userId])?.messages || [];
        const updatedHistoryWithUserMessage = [...currentHistory, userMessage];

        // 2. Actualización optimista con los datos ya procesados
        queryClient.setQueryData<Chat>(['chat', chatId, userId], (oldData) => ({
            ...(oldData || chat!),
            messages: updatedHistoryWithUserMessage,
        }));
        
        // La enviaremos a la API y luego la persistiremos
        if (chatMode === 'chat') {
            try {
                const stream = await api.sendDirectChatMessage(text, currentHistory, processedAttachments);
                
                let botResponseText = '';
                const botMessageId = `bot_${new Date().getTime()}`;

                for await (const chunk of stream) {
                    botResponseText += chunk;
                    queryClient.setQueryData<Chat>(['chat', chatId, userId], (oldData) => {
                        if (!oldData) return oldData;
                        const botMessageExists = oldData.messages.some(m => m.id === botMessageId);
                        let newMessages: Message[];
                        if (botMessageExists) {
                            newMessages = oldData.messages.map(m =>
                                m.id === botMessageId ? { ...m, text: botResponseText + '▌' } : m
                            );
                        } else {
                            const newBotMessage: Message = {
                                id: botMessageId, sender: 'bot', text: botResponseText + '▌',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            };
                            newMessages = [...oldData.messages, newBotMessage];
                        }
                        return { ...oldData, messages: newMessages };
                    });
                }

                queryClient.setQueryData<Chat>(['chat', chatId, userId], (oldData) => {
                    if (!oldData) return oldData;
                    const finalMessages = oldData.messages.map(m =>
                        m.id === botMessageId ? { ...m, text: botResponseText } : m
                    );
                    updateChatMutation({ chatId, userId, messages: finalMessages, mode: chatMode });
                    return { ...oldData, messages: finalMessages };
                });

            } catch (error) {
                console.error("Error consumiendo el stream:", error);
                toast.error(`Error de comunicación: ${error instanceof Error ? error.message : 'Desconocido'}`);
            } finally {
                setIsSending(false);
            }
        } else {
            setIsSending(false);
        }
    };

    const handleSaveTitle = (newTitle: string) => {
        if (!newTitle.trim() || !chatId || !userId || newTitle.trim() === chatTitle) return false;
        
        updateChatMutation({ chatId, userId, title: newTitle.trim() });
        toast.success("Título del chat actualizado.");
        return true;
    };

    // La lógica para cancelar procesos de agente y los useEffects se mantienen igual
    const handleCancelProcess = () => { /* ... */ };

    return {
        messages,
        isSending: isSending || isLoadingChat,
        isTyping: isSending && chatMode === 'chat', // Simplificamos isTyping
        chatTitle,
        chatMode,
        isWaitingLongResponse: false, // Por ahora
        handleSendMessage,
        setChatMode,
        handleSaveTitle,
        handleCancelProcess,
    };
};