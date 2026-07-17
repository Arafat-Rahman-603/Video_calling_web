import { Socket, Server } from 'socket.io';
import { getDB } from './config-db';
import { ChatMessage } from './types-index';

export function setupChatHandlers(io: Server, socket: Socket) {
  const userId = socket.handshake.query.userId as string;

  // Send message
  socket.on(
    'send-message',
    async (data: { to: string; content: string; callId?: string }) => {
      try {
        const { to, content, callId } = data;

        // Save to database
        const db = getDB();
        const messagesCollection = db.collection<ChatMessage>('chat_messages');

        const message: ChatMessage = {
          senderId: userId,
          receiverId: to,
          content,
          timestamp: new Date(),
          callId,
        };

        const result = await messagesCollection.insertOne(message);

        // Send to recipient
        const recipientSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.handshake.query.userId === to
        );

        if (recipientSocket) {
          recipientSocket.emit('receive-message', {
            _id: result.insertedId.toString(),
            from: userId,
            content,
            timestamp: message.timestamp,
            callId,
          });
        }

        // Send back to sender confirmation
        socket.emit('message-sent', {
          _id: result.insertedId.toString(),
          timestamp: message.timestamp,
        });

        console.log(`[Chat] Message from ${userId} to ${to}`);
      } catch (error) {
        console.error('[Chat] Send message error:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    }
  );

  // Typing indicator
  socket.on('typing', (data: { to: string; isTyping: boolean }) => {
    try {
      const { to, isTyping } = data;

      const recipientSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.handshake.query.userId === to
      );

      if (recipientSocket) {
        recipientSocket.emit('user-typing', {
          from: userId,
          isTyping,
        });
      }
    } catch (error) {
      console.error('[Chat] Typing indicator error:', error);
    }
  });

  // Load chat history for a conversation
  socket.on('load-conversation', async (data: { withUserId: string }) => {
    try {
      const { withUserId } = data;

      const db = getDB();
      const messagesCollection = db.collection<ChatMessage>('chat_messages');

      const messages = await messagesCollection
        .find(
          {
            $or: [
              { senderId: userId, receiverId: withUserId },
              { senderId: withUserId, receiverId: userId },
            ],
          }
        )
        .sort({ timestamp: 1 })
        .toArray();

      socket.emit('conversation-loaded', {
        messages: messages.map((msg) => ({
          _id: msg._id?.toString(),
          from: msg.senderId,
          to: msg.receiverId,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      });
    } catch (error) {
      console.error('[Chat] Load conversation error:', error);
      socket.emit('chat-error', { error: 'Failed to load conversation' });
    }
  });

  // Load call messages
  socket.on('load-call-messages', async (data: { callId: string }) => {
    try {
      const { callId } = data;

      const db = getDB();
      const messagesCollection = db.collection<ChatMessage>('chat_messages');

      const messages = await messagesCollection
        .find({ callId })
        .sort({ timestamp: 1 })
        .toArray();

      socket.emit('call-messages-loaded', {
        messages: messages.map((msg) => ({
          _id: msg._id?.toString(),
          from: msg.senderId,
          to: msg.receiverId,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      });
    } catch (error) {
      console.error('[Chat] Load call messages error:', error);
      socket.emit('chat-error', { error: 'Failed to load call messages' });
    }
  });
}
