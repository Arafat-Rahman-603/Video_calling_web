import { Socket, Server } from 'socket.io';
import { onlineUsers } from './routes-users';
import { SignalingMessage, OnlineUser } from './types-index';
import { ObjectId } from 'mongodb';
import { getDB } from './config-db';
import { User } from './types-index';

export function setupSignalingHandlers(io: Server, socket: Socket) {
  const userId = socket.handshake.query.userId as string;

  // User comes online
  socket.on('user-online', async (user: OnlineUser) => {
    try {
      onlineUsers.set(userId, user);

      // Broadcast to all clients that a user is online
      io.emit('user-list-updated', Array.from(onlineUsers.values()));

      console.log(`[Signaling] User ${user.username} (${userId}) is online`);
      console.log(`[Signaling] Total online users: ${onlineUsers.size}`);
    } catch (error) {
      console.error('[Signaling] user-online error:', error);
    }
  });

  // Get list of online users
  socket.on('get-online-users', () => {
    try {
      const onlineUsersList = Array.from(onlineUsers.values());
      socket.emit('online-users', onlineUsersList);
    } catch (error) {
      console.error('[Signaling] get-online-users error:', error);
    }
  });

  // Call initiation
  socket.on('call-initiate', (data: { to: string; from: string; fromUser: OnlineUser; callId?: string }) => {
    try {
      const recipientSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.handshake.query.userId === data.to
      );

      if (recipientSocket) {
        recipientSocket.emit('incoming-call', {
          from: data.from,
          fromUser: data.fromUser,
          callId: data.callId,
        });

        console.log(`[Signaling] Call from ${data.fromUser.username} to ${data.to}`);
      } else {
        socket.emit('call-failed', { message: 'User is offline' });
      }
    } catch (error) {
      console.error('[Signaling] call-initiate error:', error);
    }
  });

  // Call acceptance
  socket.on('call-accept', (data: { to: string; from: string; callId: string }) => {
    try {
      const callerSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.handshake.query.userId === data.to
      );

      if (callerSocket) {
        callerSocket.emit('call-accepted', {
          from: data.from,
          callId: data.callId,
        });

        console.log(`[Signaling] Call accepted between ${data.from} and ${data.to}`);
      }
    } catch (error) {
      console.error('[Signaling] call-accept error:', error);
    }
  });

  // Call rejection
  socket.on('call-reject', (data: { to: string; from: string; reason?: string }) => {
    try {
      const callerSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.handshake.query.userId === data.to
      );

      if (callerSocket) {
        callerSocket.emit('call-rejected', {
          from: data.from,
          reason: data.reason || 'User rejected the call',
        });

        console.log(`[Signaling] Call rejected from ${data.from}`);
      }
    } catch (error) {
      console.error('[Signaling] call-reject error:', error);
    }
  });

  // Send offer (SDP)
  socket.on('offer', (data: SignalingMessage) => {
    try {
      const recipientSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.handshake.query.userId === data.to
      );

      if (recipientSocket) {
        recipientSocket.emit('offer', {
          from: data.from,
          data: data.data,
        });

        console.log(`[Signaling] Offer sent from ${data.from} to ${data.to}`);
      }
    } catch (error) {
      console.error('[Signaling] offer error:', error);
    }
  });

  // Send answer (SDP)
  socket.on('answer', (data: SignalingMessage) => {
    try {
      const callerSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.handshake.query.userId === data.to
      );

      if (callerSocket) {
        callerSocket.emit('answer', {
          from: data.from,
          data: data.data,
        });

        console.log(`[Signaling] Answer sent from ${data.from} to ${data.to}`);
      }
    } catch (error) {
      console.error('[Signaling] answer error:', error);
    }
  });

  // Exchange ICE candidates
  socket.on('ice-candidate', (data: SignalingMessage) => {
    try {
      const recipientSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.handshake.query.userId === data.to
      );

      if (recipientSocket) {
        recipientSocket.emit('ice-candidate', {
          from: data.from,
          data: data.data,
        });
      }
    } catch (error) {
      console.error('[Signaling] ice-candidate error:', error);
    }
  });

  // Call ended
  socket.on('call-end', (data: { to: string; from: string; callId: string }) => {
    try {
      const recipientSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.handshake.query.userId === data.to
      );

      if (recipientSocket) {
        recipientSocket.emit('call-ended', {
          from: data.from,
          callId: data.callId,
        });

        console.log(`[Signaling] Call ended between ${data.from} and ${data.to}`);
      }
    } catch (error) {
      console.error('[Signaling] call-end error:', error);
    }
  });

  // User goes offline
  socket.on('disconnect', () => {
    try {
      onlineUsers.delete(userId);
      io.emit('user-list-updated', Array.from(onlineUsers.values()));

      console.log(`[Signaling] User ${userId} disconnected`);
      console.log(`[Signaling] Total online users: ${onlineUsers.size}`);
    } catch (error) {
      console.error('[Signaling] disconnect error:', error);
    }
  });
}
