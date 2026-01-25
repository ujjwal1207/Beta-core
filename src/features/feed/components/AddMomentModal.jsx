import React, { useState, useRef } from 'react';
import { X, ImageIcon, VideoIcon, Loader } from 'lucide-react';
import Button from '../../../components/ui/Button';
import feedService from '../../../services/feedService';
import { useAppContext } from '../../../context/AppContext';
import { MOOD_LABELS, MOOD_COLORS } from '../../../config/theme';

const AddMomentModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAppContext();
  const [momentText, setMomentText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handlePost = async () => {
    if (!momentText.trim() && !selectedFile) {
      setError('Please enter some text or select a file');
      return;
    }

    setIsPosting(true);
    setError('');

    try {
      const currentMood = user?.mood ?? 1;
      console.log('[AddMomentModal] Creating post with mood:', currentMood, 'User mood:', user?.mood);
      
      const postData = {
        content: momentText,
        type: 'moment',
        mood_at_time: currentMood, // Use user's current mood (0-3), default to 1 (Just... okay)
      };

      // Add file if present (send actual file, not base64)
      if (selectedFile) {
        postData.file = selectedFile;
        console.log('Uploading file:', selectedFile.name, 'type:', selectedFile.type, 'size:', selectedFile.size);
      }

      await feedService.createPost(postData);
      
      // Close modal and reset
      onClose();
      setMomentText('');
      setSelectedFile(null);
      
      // Notify parent to refresh feed
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      console.log("File selected:", file.name, file.type, "size:", (file.size / 1024 / 1024).toFixed(2) + "MB");
      setSelectedFile(file);
      setError(''); // Clear any previous errors
    }
  };

  const triggerFileInput = (accept) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-800">Create New Post</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="px-6 pt-3 pb-0">
          <div className="text-sm text-slate-600">
            Posting as: <span className="font-semibold" style={{ color: MOOD_COLORS[user?.mood ?? 1] }}>
              {MOOD_LABELS[user?.mood ?? 1]}
            </span>
          </div>
        </div>
        <div className="p-6 pt-3 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            rows="6"
            placeholder="What's on your mind? Share an update, a lesson, or a win..."
            value={momentText}
            onChange={(e) => setMomentText(e.target.value)}
            disabled={isPosting}
          />
          <div className="mt-4 flex space-x-3">
            <button 
              onClick={() => triggerFileInput('image/*')}
              className="flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all"
            >
              <ImageIcon className="w-5 h-5 mr-2 text-blue-500" />
              Add Photo
            </button>
            <button 
              onClick={() => triggerFileInput('video/*')}
              className="flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all"
            >
              <VideoIcon className="w-5 h-5 mr-2 text-rose-500" />
              Add Video
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          {selectedFile && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg text-sm font-medium text-indigo-700 border border-indigo-200 flex justify-between items-center">
              <span className="truncate pr-2">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="p-1 rounded-full hover:bg-indigo-100 flex-shrink-0">
                <X className="w-4 h-4 text-indigo-500" />
              </button>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 space-y-3">
          <Button primary onClick={handlePost} disabled={isPosting || (momentText.trim().length === 0 && !selectedFile)}>
            {isPosting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin inline" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </Button>
          <Button skip onClick={onClose} disabled={isPosting}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default AddMomentModal;
