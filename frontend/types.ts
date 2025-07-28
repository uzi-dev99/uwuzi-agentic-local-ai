export enum UserRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export type ChatMode = 'agent' | 'chat';

export interface Message {
  id: string;
  role: UserRole;
  content: string; // Content for display in the UI
  apiContent?: string; // Content to be sent to the API, can differ from display content
  timestamp: string;
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