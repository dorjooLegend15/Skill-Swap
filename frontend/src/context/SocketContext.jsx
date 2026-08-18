import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingMessages, setIncomingMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/${user.id}?token=${token}`;

    let ws = null;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      return;
    }

    ws.onopen = () => {
      console.log('⚡ Connected to SkillSwap Real-time WebSocket');
      setSocket(ws);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 1. Presence Update
        if (data.type === 'presence_update') {
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            if (data.is_online) {
              next.add(data.user_id);
            } else {
              next.delete(data.user_id);
            }
            return next;
          });
          dispatchCustomEvent('presence_update', data);
        }

        // 2. Direct Message
        else if (data.type === 'new_message') {
          setIncomingMessages((prev) => [...prev.slice(-50), data.message]);
          dispatchCustomEvent('message', data.message);
        }

        // 3. Typing
        else if (data.type === 'typing_start') {
          setTypingUsers((prev) => ({ ...prev, [data.sender_id]: true }));
        } else if (data.type === 'typing_stop') {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[data.sender_id];
            return next;
          });
        }

        // 4. WebRTC Video Call Events
        else if (data.type === 'call-request') {
          setIncomingCall({
            sender_id: data.sender_id,
            caller_name: data.caller_name || 'Swap Partner',
            caller_avatar: data.caller_avatar,
            call_type: data.call_type || 'video',
          });
        } else if (data.type === 'call-accept') {
          dispatchCustomEvent('call-accept', data);
        } else if (data.type === 'call-reject') {
          setIncomingCall(null);
          setActiveCall(null);
          dispatchCustomEvent('call-reject', data);
        } else if (data.type === 'call-offer') {
          dispatchCustomEvent('call-offer', data);
        } else if (data.type === 'call-answer') {
          dispatchCustomEvent('call-answer', data);
        } else if (data.type === 'ice-candidate') {
          dispatchCustomEvent('ice-candidate', data);
        } else if (data.type === 'call-end') {
          setIncomingCall(null);
          setActiveCall(null);
          dispatchCustomEvent('call-end', data);
        }
      } catch (err) {
        console.error('Error handling websocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user?.id, token]);

  const dispatchCustomEvent = (eventName, data) => {
    const callbacks = listenersRef.current.get(eventName) || [];
    callbacks.forEach((cb) => cb(data));
  };

  const subscribe = (eventName, callback) => {
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, []);
    }
    listenersRef.current.get(eventName).push(callback);

    return () => {
      const callbacks = listenersRef.current.get(eventName) || [];
      listenersRef.current.set(
        eventName,
        callbacks.filter((cb) => cb !== callback)
      );
    };
  };

  const emit = (data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  const sendChatMessage = (receiverId, content, media = {}) => {
    return emit({
      type: 'chat_message',
      receiver_id: receiverId,
      content,
      ...media,
    });
  };

  const sendMessage = (dataOrReceiverId, content, media = {}) => {
    if (typeof dataOrReceiverId === 'object') {
      const d = dataOrReceiverId;
      if (d.type === 'chat' || d.type === 'chat_message') {
        return sendChatMessage(d.to || d.receiver_id, d.content, {
          msg_type: d.msg_type,
          file_url: d.media_url || d.file_url,
          file_name: d.file_name,
          file_size: d.file_size,
        });
      }
      return emit(d);
    }
    return sendChatMessage(dataOrReceiverId, content, media);
  };

  const sendTyping = (targetId, isTyping) => {
    emit({
      type: isTyping ? 'typing_start' : 'typing_stop',
      target_id: targetId,
    });
  };

  const sendCallSignal = (targetId, type, extra = {}) => {
    emit({
      type,
      target_id: targetId,
      ...extra,
    });
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(Number(userId));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        isUserOnline,
        incomingCall,
        setIncomingCall,
        activeCall,
        setActiveCall,
        incomingMessages,
        typingUsers,
        sendChatMessage,
        sendMessage,
        sendTyping,
        sendCallSignal,
        subscribe,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
