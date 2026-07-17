import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  username: string;
  displayName: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Call {
  _id?: ObjectId;
  initiatorId: string;
  receiverId?: string;
  groupMembers?: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  type: 'one-on-one' | 'group';
  createdAt: Date;
}

export interface ChatMessage {
  _id?: ObjectId;
  senderId: string;
  receiverId?: string;
  content: string;
  timestamp: Date;
  callId?: string;
}

export interface CallHistory {
  _id?: ObjectId;
  userId: string;
  otherUserId?: string;
  groupMembers?: string[];
  callId: string;
  duration: number;
  timestamp: Date;
  type: 'one-on-one' | 'group';
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Omit<User, 'password'>;
  error?: string;
}

export interface OnlineUser {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: any;
}
