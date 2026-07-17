'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSocket, signalingEvents } from '@/lib/socket';
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
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react';

interface VideoCallProps {
  callId: string;
  remoteUserId: string;
  onCallEnd: () => void;
}

export function VideoCall({ callId, remoteUserId, onCallEnd }: VideoCallProps) {
  const { user } = useAuth();
  const socket = getSocket();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);

  const isInitiator = useRef(false);

  // Initialize local stream
  useEffect(() => {
    const setupLocalStream = async () => {
      try {
        const stream = await getLocalStream(true, true);
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('[VideoCall] Failed to get local stream:', error);
      }
    };

    setupLocalStream();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Setup peer connection and signaling
  useEffect(() => {
    if (!localStream || !user) return;

    const setupPeerConnection = async () => {
      try {
        const pc = await createPeerConnection(
          localStream,
          (stream) => {
            setRemoteStream(stream);
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

        setPeerConnection(pc);

        // If initiator, create and send offer
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

    setupPeerConnection();

    return () => {
      if (peerConnection) {
        closePeerConnection(peerConnection);
      }
    };
  }, [localStream, user, remoteUserId, socket]);

  // Listen for signaling events
  useEffect(() => {
    // Handle incoming offer
    socket.on(signalingEvents.OFFER, async (data: any) => {
      try {
        if (peerConnection) {
          await addOffer(peerConnection, data.data);
          const answer = await createAnswer(peerConnection);
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

    // Handle incoming answer
    socket.on(signalingEvents.ANSWER, async (data: any) => {
      try {
        if (peerConnection) {
          await addAnswer(peerConnection, data.data);
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('[VideoCall] Error handling answer:', error);
      }
    });

    // Handle ICE candidates
    socket.on(signalingEvents.ICE_CANDIDATE, async (data: any) => {
      try {
        if (peerConnection && data.data) {
          await addICECandidate(peerConnection, data.data);
        }
      } catch (error) {
        console.error('[VideoCall] Error adding ICE candidate:', error);
      }
    });

    // Handle call end
    socket.on(signalingEvents.CALL_ENDED, () => {
      handleCallEnd();
    });

    return () => {
      socket.off(signalingEvents.OFFER);
      socket.off(signalingEvents.ANSWER);
      socket.off(signalingEvents.ICE_CANDIDATE);
      socket.off(signalingEvents.CALL_ENDED);
    };
  }, [peerConnection, remoteUserId, user?._id, socket]);

  // Call duration timer
  useEffect(() => {
    if (callStatus !== 'connected') return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus]);

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
    // Clean up
    if (localStream) {
      closeStream(localStream);
    }
    if (peerConnection) {
      closePeerConnection(peerConnection);
    }

    // Notify remote user
    if (user && socket) {
      socket.emit(signalingEvents.CALL_END, {
        from: user._id,
        to: remoteUserId,
        callId,
      });
    }

    onCallEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full bg-black relative">
      {/* Remote Video - Full Screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local Video - Picture in Picture */}
      <div className="absolute bottom-6 right-6 w-48 h-36 bg-black border-2 border-white rounded-lg overflow-hidden shadow-lg">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button
          onClick={handleToggleAudio}
          className={`p-3 rounded-full transition-colors ${
            isAudioEnabled
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? (
            <Mic size={24} className="text-white" />
          ) : (
            <MicOff size={24} className="text-white" />
          )}
        </button>

        <button
          onClick={handleToggleVideo}
          className={`p-3 rounded-full transition-colors ${
            isVideoEnabled
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isVideoEnabled ? 'Stop video' : 'Start video'}
        >
          {isVideoEnabled ? (
            <Video size={24} className="text-white" />
          ) : (
            <VideoOff size={24} className="text-white" />
          )}
        </button>

        <button
          onClick={handleCallEnd}
          className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          title="End call"
        >
          <PhoneOff size={24} className="text-white" />
        </button>
      </div>

      {/* Call Status */}
      <div className="absolute top-6 left-6 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
        <p className="text-sm">
          {callStatus === 'connecting' ? 'Connecting...' : 'Connected'}
        </p>
        <p className="text-lg font-mono">{formatDuration(callDuration)}</p>
      </div>
    </div>
  );
}
