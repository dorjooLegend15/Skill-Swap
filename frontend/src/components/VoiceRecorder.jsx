import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, Volume2 } from 'lucide-react';
import { messagesAPI } from '../services/api';

const VoiceRecorder = ({ onSendVoiceNote, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
        clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access is required to record voice notes.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const stopRecordingCleanup = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handlePlayPause = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', recordedBlob, `voice_note_${Date.now()}.webm`);
      formData.append('media_type', 'audio');
      formData.append('audio_duration', duration.toString());

      const res = await messagesAPI.uploadMedia(formData);
      onSendVoiceNote({
        file_url: res.data.file_url,
        file_name: res.data.file_name,
        file_size: res.data.file_size,
        audio_duration: duration,
        msg_type: 'audio',
      });
    } catch (err) {
      console.error('Failed to upload voice note:', err);
      alert('Failed to send voice note.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl border border-slate-200 shadow-lg animate-fadeIn w-full">
      {isRecording ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-red-400">Recording Voice Note...</span>
            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="p-2 text-slate-600 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
              title="Cancel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={stopRecording}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-all cursor-pointer shadow"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <span className="text-xs font-mono text-slate-600">{formatTime(duration)}</span>
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="p-2 text-slate-600 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
              title="Discard"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={uploading}
              className="py-1.5 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Note
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
