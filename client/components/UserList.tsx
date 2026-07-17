'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { signalingEvents } from '@/lib/socket';
import { Phone } from 'lucide-react';

interface OnlineUser {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export function UserList({
  onCallInitiate,
  socket,
}: {
  onCallInitiate: (userId: string) => void;
  socket: Socket | null;
}) {
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Request online users
    socket.emit(signalingEvents.GET_ONLINE_USERS);

    // Listen for online users list
    socket.on(signalingEvents.ONLINE_USERS, (usersList: OnlineUser[]) => {
      setUsers(usersList);
    });

    // Listen for user list updates
    socket.on(signalingEvents.USER_LIST_UPDATED, (usersList: OnlineUser[]) => {
      setUsers(usersList);
    });

    return () => {
      socket.off(signalingEvents.ONLINE_USERS);
      socket.off(signalingEvents.USER_LIST_UPDATED);
    };
  }, [socket]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Online Users ({users.length})</h2>

      {users.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No users online</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{user.displayName}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>

              <button
                onClick={() => onCallInitiate(user.userId)}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                title="Call user"
              >
                <Phone size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
