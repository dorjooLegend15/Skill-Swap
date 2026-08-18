import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Maximize2,
  PhoneCall,
  Volume2
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoCallModal = ({ partner, isCaller = false, onClose }) => {
  const { user } = useAuth();
  const { sendCallSignal, subscribe, setIncomingCall } = useSocket();

  const [callStatus, setCallStatus] = useState(isCaller ? 'calling' : 'connected'); // 'calling', 'connected', 'ended'
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startMediaAndConnection();

    return () => {
      cleanupCall();
    };
  }, []);

  const startMediaAndConnection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC PeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setCallStatus('connected');
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendCallSignal(partner.id, 'ice-candidate', {
            candidate: event.candidate,
          });
        }
      };

      // If caller, send call request and create offer
      if (isCaller) {
        sendCallSignal(partner.id, 'call-request', {
          caller_name: user.full_name,
          caller_avatar: user.avatar,
        });
      }

      // Subscribe to WebRTC events
      const unsubAccept = subscribe('call-accept', async () => {
        setCallStatus('connected');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendCallSignal(partner.id, 'call-offer', { offer });
      });

      const unsubOffer = subscribe('call-offer', async (data) => {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendCallSignal(partner.id, 'call-answer', { answer });
        setCallStatus('connected');
      });

      const unsubAnswer = subscribe('call-answer', async (data) => {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      });

      const unsubCandidate = subscribe('ice-candidate', async (data) => {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      });

      const unsubEnd = subscribe('call-end', () => {
        cleanupCall();
        onClose();
      });

      const unsubReject = subscribe('call-reject', () => {
        alert(`${partner.full_name} declined the video call.`);
        cleanupCall();
        onClose();
      });

      // Start call timer when connected
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => {
        unsubAccept();
        unsubOffer();
        unsubAnswer();
        unsubCandidate();
        unsubEnd();
        unsubReject();
      };
    } catch (err) {
      console.error('Error setting up WebRTC call:', err);
      alert('Camera & Microphone access is needed for video calls.');
      onClose();
    }
  };

  const cleanupCall = () => {
    clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const handleEndCall = () => {
    sendCallSignal(partner.id, 'call-end', {});
    cleanupCall();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    const sender = peerConnectionRef.current
      ?.getSenders()
      .find((s) => s.track.kind === 'video');
    if (sender && videoTrack) {
      sender.replaceTrack(videoTrack);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0f172a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between">
        
        {/* Top Header Bar */}
        <div className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <img
              src={partner.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`}
              alt={partner.full_name}
              className="w-8 h-8 rounded-full border border-white/20 object-cover"
            />
            <div>
              <h4 className="text-sm font-bold truncate">{partner.full_name}</h4>
              <span className="text-[11px] text-emerald-400 font-mono block">
                {callStatus === 'calling' ? 'Calling...' : `Live Swap • ${formatDuration(callDuration)}`}
              </span>
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-xs font-semibold text-gray-300">
            1-on-1 Peer Encrypted
          </div>
        </div>

        {/* Video Area */}
        <div className="relative w-full h-full flex items-center justify-center bg-gray-950 overflow-hidden">
          {/* Remote Video (Full Screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Placeholder if remote video stream not yet received */}
          {callStatus === 'calling' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0f19] z-10">
              <div className="relative mb-6">
                <img
                  src={partner.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.full_name}`}
                  alt={partner.full_name}
                  className="w-28 h-28 rounded-full border-4 border-emerald-500/50 object-cover shadow-2xl animate-pulse"
                />
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-50"></span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Calling {partner.full_name}...</h3>
              <p className="text-sm text-gray-400">Waiting for partner to accept</p>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-24 right-6 w-36 h-48 md:w-48 md:h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black z-20 group">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-xs text-gray-400 font-semibold">
                Camera Off
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-medium">
              You {isMuted && '(Muted)'}
            </div>
          </div>
        </div>

        {/* Bottom Call Controls Floating Toolbar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-4 bg-gray-900/80 backdrop-blur-xl px-6 py-3 rounded-full border border-white/15 shadow-2xl">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-full transition-all cursor-pointer ${
              isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition-all cursor-pointer ${
              isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition-all cursor-pointer ${
              isScreenSharing ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg hover:scale-105 cursor-pointer"
            title="End Video Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
