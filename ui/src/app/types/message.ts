export interface User {
  _id: string;
  name: string;
  pictures: Array<{
    url: string;
    uploadedAt: Date;
  }>;
}

export interface Message {
  _id: string;
  sender: User;
  content: string;
  chatType: 'one-to-one' | 'group';
  recipient?: User;
  eventId?: string;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  createdAt: Date;
}

export interface ChatPreview {
  _id: string;
  type: 'one-to-one' | 'group';
  name: string;
  lastMessage?: Message;
  unreadCount: number;
  participants?: User[];
  eventId?: string;
} 