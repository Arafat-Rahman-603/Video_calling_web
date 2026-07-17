'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { VideoCall } from '@/components/VideoCall';

export default function CallPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const callId = params.callId as string;
  const remoteUserId = searchParams.get('remoteUserId');

  if (!remoteUserId || !callId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-300 mb-4">Invalid call parameters</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen bg-black">
        <VideoCall
          callId={callId}
          remoteUserId={remoteUserId}
          onCallEnd={() => {
            router.push('/dashboard');
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
