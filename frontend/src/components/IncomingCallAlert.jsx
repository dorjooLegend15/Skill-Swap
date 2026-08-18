import React from 'react';
import { PhoneCall, PhoneOff, Video } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const IncomingCallAlert = ({ onAcceptCall }) => {
  const { incomingCall, setIncomingCall, sendCallSignal } = useSocket();

  if (!incomingCall) return null;

  const handleAccept = () => {
    sendCallSignal(incomingCall.sender_id, 'call-accept', {});
    const partnerData = {
      id: incomingCall.sender_id,
      full_name: incomingCall.caller_name,
      avatar: incomingCall.caller_avatar,
    };
    onAcceptCall(partnerData);
    setIncomingCall(null);
  };

  const handleDecline = () => {
    sendCallSignal(incomingCall.sender_id, 'call-reject', {});
    setIncomingCall(null);
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-bounce">
      <div className="glass-panel border-2 border-violet-400/50 rounded-3xl p-5 shadow-2xl flex items-center gap-4 max-w-sm">
        <div className="relative">
          <img
            src={incomingCall.caller_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.caller_name}`}
            alt={incomingCall.caller_name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-violet-400 shadow-md"
          />
          <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full p-1 text-white shadow">
            <Video className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-800 truncate">{incomingCall.caller_name}</h4>
          <p className="text-xs text-violet-600 font-medium">Incoming Video Call...</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDecline}
            className="p-3 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-2xl transition-all cursor-pointer"
            title="Decline"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
          <button
            onClick={handleAccept}
            className="p-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-2xl transition-all shadow-lg glow-accent cursor-pointer"
            title="Accept Call"
          >
            <PhoneCall className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallAlert;
