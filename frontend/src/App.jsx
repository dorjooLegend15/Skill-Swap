import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBotWidget from './components/ChatBotWidget';
import IncomingCallAlert from './components/IncomingCallAlert';
import VideoCallModal from './components/VideoCallModal';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import ChatbotPage from './pages/ChatbotPage';
import RequestsPage from './pages/RequestsPage';
import ChatPage from './pages/ChatPage';
import SessionsPage from './pages/SessionsPage';
import ProfilePage from './pages/ProfilePage';
import UserProfileDetail from './pages/UserProfileDetail';
import Login from './pages/Login';
import Register from './pages/Register';

function AppContent() {
  const [activeCallPartner, setActiveCallPartner] = useState(null);

  const handleAcceptIncomingCall = (partner) => {
    setActiveCallPartner(partner);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-800 selection:bg-violet-500/30 selection:text-black">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/users/:userId" element={<UserProfileDetail />} />
          
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Global Floating AI Chatbot Widget */}
      <ChatBotWidget />

      {/* Global Incoming Call Alert */}
      <IncomingCallAlert onAcceptCall={handleAcceptIncomingCall} />

      {/* Active Received Video Call */}
      {activeCallPartner && (
        <VideoCallModal
          partner={activeCallPartner}
          isCaller={false}
          onClose={() => setActiveCallPartner(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
