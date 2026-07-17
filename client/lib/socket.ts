import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initializeSocket(userId: string): Socket {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  if (!socket) {
    socket = io(backendUrl, {
      query: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });
  }

  return socket;
}

export function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Signaling events
export const signalingEvents = {
  USER_ONLINE: 'user-online',
  GET_ONLINE_USERS: 'get-online-users',
  ONLINE_USERS: 'online-users',
  USER_LIST_UPDATED: 'user-list-updated',
  CALL_INITIATE: 'call-initiate',
  INCOMING_CALL: 'incoming-call',
  CALL_ACCEPT: 'call-accept',
  CALL_ACCEPTED: 'call-accepted',
  CALL_REJECT: 'call-reject',
  CALL_REJECTED: 'call-rejected',
  CALL_FAILED: 'call-failed',
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice-candidate',
  CALL_END: 'call-end',
  CALL_ENDED: 'call-ended',
};

// Chat events
export const chatEvents = {
  SEND_MESSAGE: 'send-message',
  RECEIVE_MESSAGE: 'receive-message',
  MESSAGE_SENT: 'message-sent',
  MESSAGE_ERROR: 'message-error',
  TYPING: 'typing',
  USER_TYPING: 'user-typing',
  LOAD_CONVERSATION: 'load-conversation',
  CONVERSATION_LOADED: 'conversation-loaded',
  LOAD_CALL_MESSAGES: 'load-call-messages',
  CALL_MESSAGES_LOADED: 'call-messages-loaded',
  CHAT_ERROR: 'chat-error',
};
