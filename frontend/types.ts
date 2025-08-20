export enum UserRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export type ChatMode = 'agent' | 'chat';

export interface Attachment {
  name: string;
  type: 'image' | 'audio' | 'pdf-small' | 'pdf-large' | 'other';
  url: string;
}

export interface Message {
  id: string;
  role: UserRole;
  content: string; // Content for display in the UI
  apiContent?: string; // Content to be sent to the API, can differ from display content
  timestamp: string;
  attachments?: Attachment[];
}

export interface Chat {
  id:string;
  title: string;
  messages: Message[];
  folderId: string | null;
  createdAt: string;
  tags: string[];
  mode: ChatMode;
}

export interface Folder {
  id: string;
  name: string;
}

export interface FileData {
  name: string;
  type: 'image' | 'audio' | 'text' | 'pdf-small' | 'pdf-large' | 'other';
  content: string; // Base64 data URL or text content
  readable: boolean;
}