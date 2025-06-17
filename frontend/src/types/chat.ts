
export interface StoredAttachment {
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  attachments?: (File | StoredAttachment)[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  mode?: 'chat' | 'agent';
  folderId?: string;
  tags?: string[];
  isWaitingLongResponse?: boolean;
}

export interface Folder {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  avatar?: string; // base64 data URL
  role: 'admin' | 'user';
}
