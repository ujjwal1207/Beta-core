import React, { useState, useRef } from 'react';
import { X, ImageIcon, VideoIcon, Loader, Tag } from 'lucide-react';
import Button from '../../../components/ui/Button';
import feedService from '../../../services/feedService';
import { useAppContext } from '../../../context/AppContext';
import { MOOD_LABELS, MOOD_COLORS } from '../../../config/theme';

// Available tags for posts
const AVAILABLE_TAGS = [
  'career confusion',
  'startup',
  'consulting',
  'studying abroad',
  'job search',
  'career transition',
  'work-life balance',
  'salary negotiation',
  'networking',
  'entrepreneurship',
  'freelancing',
  'remote work'
];

const AddMomentModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAppContext();
  const [momentText, setMomentText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
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
        tags: selectedTags, // Include selected tags
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
      setSelectedTags([]);
      setShowTagSelector(false);

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

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
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
              className="flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all"
            >
              <ImageIcon className="w-5 h-5 mr-2 text-blue-500" />
              Photo
            </button>
            <button
              onClick={() => triggerFileInput('video/*')}
              className="flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all"
            >
              <VideoIcon className="w-5 h-5 mr-2 text-rose-500" />
              Video
            </button>
            <button
              onClick={() => setShowTagSelector(!showTagSelector)}
              className={`flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                showTagSelector || selectedTags.length > 0
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Tag className="w-5 h-5 mr-2" />
              Tags
            </button>
          </div>

          {/* Tag Selector */}
          {showTagSelector && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Select Tags (optional)</h4>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && !showTagSelector && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-2 hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
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
