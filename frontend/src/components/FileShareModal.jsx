import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { messagesAPI } from '../services/api';

const FileShareModal = ({ isOpen, onClose, onFileSent }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const isPhoto = file.type.startsWith('image/');
      const mediaType = isPhoto ? 'photo' : 'file';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', mediaType);

      const res = await messagesAPI.uploadMedia(formData);
      onFileSent({
        file_url: res.data.file_url,
        file_name: res.data.file_name,
        file_size: res.data.file_size,
        msg_type: mediaType,
      });
      onClose();
    } catch (err) {
      console.error('File upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative border border-slate-200 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-800 mb-1">Share File or Photo</h3>
        <p className="text-xs text-slate-500 mb-5">
          Send learning materials, cheatsheets, screenshots, or code files.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-violet-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50 hover:bg-violet-50 mb-4 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-violet-500 mx-auto mb-3 transition-colors" />
          <p className="text-sm font-semibold text-slate-700 mb-1">
            Click to browse or drag & drop
          </p>
          <p className="text-[11px] text-slate-400">
            Supports PNG, JPG, PDF, ZIP, code files up to 25MB
          </p>
        </div>

        {file && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              {file.type.startsWith('image/') ? (
                <ImageIcon className="w-6 h-6 text-violet-500 shrink-0" />
              ) : (
                <FileText className="w-6 h-6 text-sky-500 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-slate-400 hover:text-red-500 text-xs font-semibold"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all disabled:opacity-50 shadow-md glow-emerald cursor-pointer"
          >
            {uploading ? 'Uploading...' : 'Send File'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileShareModal;
