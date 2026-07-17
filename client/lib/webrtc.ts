export interface PeerConnection {
  peerConnection: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream: MediaStream;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export async function getLocalStream(
  audio = true,
  video = true
): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : false,
    });
    return stream;
  } catch (error) {
    console.error('[WebRTC] Failed to get local stream:', error);
    throw error;
  }
}

export async function createPeerConnection(
  localStream: MediaStream,
  onRemoteStream: (stream: MediaStream) => void,
  onICECandidate: (candidate: RTCIceCandidate) => void
): Promise<RTCPeerConnection> {
  try {
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // Add local stream tracks to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    const remoteStream = new MediaStream();

    peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      remoteStream.addTrack(event.track);
      onRemoteStream(remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] New ICE candidate');
        onICECandidate(event.candidate);
      }
    };

    // Log connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', peerConnection.connectionState);
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state:', peerConnection.iceGatheringState);
    };

    return peerConnection;
  } catch (error) {
    console.error('[WebRTC] Failed to create peer connection:', error);
    throw error;
  }
}

export async function createOffer(
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await peerConnection.setLocalDescription(offer);
    console.log('[WebRTC] Offer created');

    return offer;
  } catch (error) {
    console.error('[WebRTC] Failed to create offer:', error);
    throw error;
  }
}

export async function createAnswer(
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  try {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log('[WebRTC] Answer created');

    return answer;
  } catch (error) {
    console.error('[WebRTC] Failed to create answer:', error);
    throw error;
  }
}

export async function addAnswer(
  peerConnection: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
) {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('[WebRTC] Answer set as remote description');
  } catch (error) {
    console.error('[WebRTC] Failed to add answer:', error);
    throw error;
  }
}

export async function addOffer(
  peerConnection: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
) {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('[WebRTC] Offer set as remote description');
  } catch (error) {
    console.error('[WebRTC] Failed to add offer:', error);
    throw error;
  }
}

export async function addICECandidate(
  peerConnection: RTCPeerConnection,
  candidate: RTCIceCandidate
) {
  try {
    await peerConnection.addIceCandidate(candidate);
    console.log('[WebRTC] ICE candidate added');
  } catch (error) {
    console.error('[WebRTC] Failed to add ICE candidate:', error);
  }
}

export function closeStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

export function closePeerConnection(peerConnection: RTCPeerConnection) {
  peerConnection.close();
}

export function getStreamStats(stream: MediaStream): {
  audioTracks: number;
  videoTracks: number;
} {
  return {
    audioTracks: stream.getAudioTracks().length,
    videoTracks: stream.getVideoTracks().length,
  };
}

export function toggleAudio(stream: MediaStream, enabled: boolean) {
  stream.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
}

export function toggleVideo(stream: MediaStream, enabled: boolean) {
  stream.getVideoTracks().forEach((track) => {
    track.enabled = enabled;
  });
}
