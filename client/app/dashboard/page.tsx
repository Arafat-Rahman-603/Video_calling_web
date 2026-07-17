'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserList } from '@/components/UserList';
import { initializeSocket, getSocket, signalingEvents } from '@/lib/socket';
import { LogOut, Phone, X } from 'lucide-react';

interface IncomingCall {
  from: string;
  fromUser: {
    userId: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  callId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    try {
      const sock = initializeSocket(user._id);
      setSocket(sock);

      // Emit user online
      sock.emit(signalingEvents.USER_ONLINE, {
        userId: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      });

      // Listen for incoming calls
      sock.on(signalingEvents.INCOMING_CALL, (data: IncomingCall) => {
        setIncomingCall(data);
      });

      return () => {
        sock.off(signalingEvents.INCOMING_CALL);
      };
    } catch (error) {
      console.error('[Dashboard] Failed to initialize socket:', error);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCallInitiate = (userId: string) => {
    if (!socket || !user) return;

    const callId = Math.random().toString(36).substr(2, 9);

    socket.emit(signalingEvents.CALL_INITIATE, {
      to: userId,
      from: user._id,
      fromUser: {
        userId: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      callId,
    });

    // Navigate to call page
    router.push(`/call/${callId}?remoteUserId=${userId}`);
  };

  const handleAcceptCall = () => {
    if (!incomingCall || !socket || !user) return;

    socket.emit(signalingEvents.CALL_ACCEPT, {
      to: incomingCall.from,
      from: user._id,
      callId: incomingCall.callId,
    });

    setIncomingCall(null);
    router.push(`/call/${incomingCall.callId}?remoteUserId=${incomingCall.from}`);
  };

  const handleRejectCall = () => {
    if (!incomingCall || !socket || !user) return;

    socket.emit(signalingEvents.CALL_REJECT, {
      to: incomingCall.from,
      from: user._id,
      reason: 'Call rejected',
    });

    setIncomingCall(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Call</h1>
              <p className="text-gray-600">Welcome back, {user?.displayName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User List */}
            <div className="lg:col-span-2">
              <UserList onCallInitiate={handleCallInitiate} socket={socket} />
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <button
                  onClick={() => router.push('/history')}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  View Call History
                </button>
              </div>

              {/* User Info */}
              {user && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Your Profile</h2>
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-16 h-16 rounded-full mb-4"
                    />
                  )}
                  <p className="text-gray-900 font-medium">{user.displayName}</p>
                  <p className="text-gray-600 text-sm">@{user.username}</p>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Incoming Call</h2>

              <div className="flex items-center space-x-4 mb-6">
                {incomingCall.fromUser.avatar && (
                  <img
                    src={incomingCall.fromUser.avatar}
                    alt={incomingCall.fromUser.displayName}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{incomingCall.fromUser.displayName}</p>
                  <p className="text-gray-600">@{incomingCall.fromUser.username}</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAcceptCall}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Phone size={18} />
                  <span>Accept</span>
                </button>
                <button
                  onClick={handleRejectCall}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <X size={18} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
