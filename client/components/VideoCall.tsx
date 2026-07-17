'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSocket, initializeSocket, signalingEvents } from '@/lib/socket';
import {
  getLocalStream,
  createPeerConnection,
  createOffer,
  createAnswer,
  addOffer,
  addAnswer,
  addICECandidate,
  closeStream,
  closePeerConnection,
  toggleAudio,
  toggleVideo,
} from '@/lib/webrtc';
import { Mic, MicOff, Video, VideoOff, PhoneOff, CameraOff, AlertTriangle } from 'lucide-react';

interface VideoCallProps {
  callId: string;
  remoteUserId: string;
  onCallEnd: () => void;
}

type MediaError = 'permission-denied' | 'camera-in-use' | 'no-devices' | 'unknown' | null;

function getMediaError(error: unknown): MediaError {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return 'permission-denied';
    if (error.name === 'NotReadableError') return 'camera-in-use';
    if (error.name === 'NotFoundError') return 'no-devices';
  }
  return 'unknown';
}

function MediaErrorBanner({ errorType, onRetry }: { errorType: MediaError; onRetry: () => void }) {
  const messages: Record<NonNullable<MediaError>, { title: string; desc: string }> = {
    'permission-denied': {
      title: 'Camera & Microphone Blocked',
      desc: 'Click the camera icon in your browser address bar and allow access, then retry.',
    },
    'camera-in-use': {
      title: 'Camera Already In Use',
      desc: 'Another application is using your camera. Close it and retry.',
    },
    'no-devices': {
      title: 'No Camera or Microphone Found',
      desc: 'Please connect a camera/microphone and retry.',
    },
    'unknown': {
      title: 'Could Not Access Media Devices',
      desc: 'An unexpected error occurred accessing your camera or microphone.',
    },
  };

  if (!errorType) return null;
  const msg = messages[errorType];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 p-8">
      <div className="bg-gray-800 border border-red-500/40 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{msg.title}</h2>
        <p className="text-gray-400 text-sm mb-6">{msg.desc}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
          >
            Retry
          </button>
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition-colors"
          >
            Audio Only
          </button>
        </div>
      </div>
    </div>
  );
}

export function VideoCall({ callId, remoteUserId, onCallEnd }: VideoCallProps) {
  const { user } = useAuth();

  // Safe socket getter — won't crash if not initialized yet
  const getSocketSafe = () => {
    try { return getSocket(); } catch { return null; }
  };

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [mediaError, setMediaError] = useState<MediaError>(null);
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);

  const isInitiator = useRef(false);

  // ── 1. Get local stream ──────────────────────────────────────────────────────
  const startLocalStream = async (audioOnly = false) => {
    try {
      setMediaError(null);
      const stream = await getLocalStream(true, !audioOnly);
      setLocalStream(stream);
      setAudioOnlyMode(audioOnly);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      const errType = getMediaError(error);
      // If video fails, try audio-only automatically once
      if (!audioOnly && (errType === 'camera-in-use' || errType === 'unknown')) {
        try {
          const audioStream = await getLocalStream(true, false);
          setLocalStream(audioStream);
          setAudioOnlyMode(true);
          setIsVideoEnabled(false);
          return audioStream;
        } catch {
          // audio also failed — show the original error
        }
      }
      console.error('[VideoCall] Failed to get local stream:', error);
      setMediaError(errType);
      return null;
    }
  };

  useEffect(() => {
    startLocalStream();
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Setup peer connection once stream is ready ───────────────────────────
  useEffect(() => {
    if (!localStream || !user) return;

    const socket = getSocketSafe();
    if (!socket) return;

    const setupPC = async () => {
      try {
        const pc = await createPeerConnection(
          localStream,
          (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
          },
          (candidate) => {
            socket.emit(signalingEvents.ICE_CANDIDATE, {
              from: user._id,
              to: remoteUserId,
              data: candidate,
            });
          }
        );

        peerConnectionRef.current = pc;

        if (isInitiator.current) {
          const offer = await createOffer(pc);
          socket.emit(signalingEvents.OFFER, {
            from: user._id,
            to: remoteUserId,
            data: offer,
          });
        }
      } catch (error) {
        console.error('[VideoCall] Failed to setup peer connection:', error);
      }
    };

    setupPC();

    return () => {
      peerConnectionRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, user, remoteUserId]);

  // ── 3. Signaling listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocketSafe();
    if (!socket) return;

    socket.on(signalingEvents.OFFER, async (data: any) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await addOffer(pc, data.data);
          const answer = await createAnswer(pc);
          socket.emit(signalingEvents.ANSWER, {
            from: user?._id,
            to: remoteUserId,
            data: answer,
          });
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('[VideoCall] Error handling offer:', error);
      }
    });

    socket.on(signalingEvents.ANSWER, async (data: any) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await addAnswer(pc, data.data);
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('[VideoCall] Error handling answer:', error);
      }
    });

    socket.on(signalingEvents.ICE_CANDIDATE, async (data: any) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && data.data) {
          await addICECandidate(pc, data.data);
        }
      } catch (error) {
        console.error('[VideoCall] Error adding ICE candidate:', error);
      }
    });

    socket.on(signalingEvents.CALL_ENDED, () => {
      handleCallEnd();
    });

    return () => {
      socket.off(signalingEvents.OFFER);
      socket.off(signalingEvents.ANSWER);
      socket.off(signalingEvents.ICE_CANDIDATE);
      socket.off(signalingEvents.CALL_ENDED);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteUserId, user?._id]);

  // ── 4. Call duration timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggleAudio = () => {
    if (localStream) {
      toggleAudio(localStream, !isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      toggleVideo(localStream, !isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleCallEnd = () => {
    if (localStream) closeStream(localStream);
    peerConnectionRef.current?.close();

    const socket = getSocketSafe();
    if (user && socket) {
      socket.emit(signalingEvents.CALL_END, {
        from: user._id,
        to: remoteUserId,
        callId,
      });
    }

    setCallStatus('ended');
    onCallEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full bg-gray-950 relative overflow-hidden">
      {/* Media error overlay */}
      {mediaError && (
        <MediaErrorBanner
          errorType={mediaError}
          onRetry={() => startLocalStream(false)}
        />
      )}

      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* No remote stream placeholder */}
      {callStatus === 'connecting' && !mediaError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-6 animate-pulse">
            <span className="text-4xl">👤</span>
          </div>
          <p className="text-white text-xl font-semibold">Connecting...</p>
          <p className="text-gray-400 text-sm mt-2">Waiting for the other person</p>
        </div>
      )}

      {/* Local Video PiP */}
      <div className="absolute bottom-24 right-5 w-44 h-32 bg-gray-800 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl">
        {audioOnlyMode ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
            <CameraOff className="w-8 h-8 text-gray-400 mb-1" />
            <span className="text-gray-400 text-xs">Audio only</span>
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Call Status Badge */}
      <div className="absolute top-5 left-5 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full">
        <span
          className={`w-2 h-2 rounded-full ${
            callStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
          }`}
        />
        <span className="text-sm font-medium">
          {callStatus === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
        </span>
        {audioOnlyMode && (
          <span className="text-xs text-gray-400 ml-1">· Audio only</span>
        )}
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={handleToggleAudio}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isAudioEnabled
              ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
              : 'bg-red-600 hover:bg-red-500'
          }`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? (
            <Mic className="w-6 h-6 text-white" />
          ) : (
            <MicOff className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={handleToggleVideo}
          disabled={audioOnlyMode}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
            audioOnlyMode
              ? 'bg-gray-700 cursor-not-allowed opacity-50'
              : isVideoEnabled
              ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
              : 'bg-red-600 hover:bg-red-500'
          }`}
          title={audioOnlyMode ? 'Camera unavailable' : isVideoEnabled ? 'Stop video' : 'Start video'}
        >
          {isVideoEnabled && !audioOnlyMode ? (
            <Video className="w-6 h-6 text-white" />
          ) : (
            <VideoOff className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={handleCallEnd}
          className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-all shadow-lg"
          title="End call"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}
