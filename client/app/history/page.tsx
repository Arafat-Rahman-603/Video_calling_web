'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArrowLeft, Clock, User } from 'lucide-react';

interface CallHistoryItem {
  _id: string;
  callId: string;
  duration: number;
  timestamp: string;
  type: 'one-on-one' | 'group';
  otherUserId?: string;
  otherUserName?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [history, setHistory] = useState<CallHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const response = await fetch(`${API_URL}/api/calls/history?limit=50`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setHistory(data.calls);
        } else {
          setError(data.message || 'Failed to fetch history');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchHistory();
    }
  }, [token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-900" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
              <p className="text-gray-600">View your recent calls</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading call history...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No call history yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {history.map((call) => (
                  <div
                    key={call._id}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {call.type === 'one-on-one' ? 'Call' : 'Group Call'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(call.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatDuration(call.duration)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {call.type === 'one-on-one' ? 'One-on-one' : 'Group'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
