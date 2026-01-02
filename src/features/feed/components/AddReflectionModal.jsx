import React, { useState, useRef } from 'react';
import { X, ImageIcon, VideoIcon, Loader, Palette, Type } from 'lucide-react';
import Button from '../../../components/ui/Button';
import feedService from '../../../services/feedService';
import { useAppContext } from '../../../context/AppContext';
import { MOOD_LABELS, MOOD_COLORS } from '../../../config/theme';

const AddReflectionModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAppContext();
  const [reflectionText, setReflectionText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Style customization states
  const [backgroundColor, setBackgroundColor] = useState('bg-gradient-to-br from-indigo-500 to-purple-600');
  const [textColor, setTextColor] = useState('text-white');
  const [textStyle, setTextStyle] = useState('font-normal');

  // Background gradient options
  const backgroundOptions = [
    { name: 'Indigo Purple', value: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
    { name: 'Ocean Blue', value: 'bg-gradient-to-br from-blue-400 to-cyan-500' },
    { name: 'Sunset', value: 'bg-gradient-to-br from-orange-400 to-rose-500' },
    { name: 'Forest', value: 'bg-gradient-to-br from-green-400 to-emerald-600' },
    { name: 'Lavender', value: 'bg-gradient-to-br from-purple-300 to-pink-400' },
    { name: 'Golden', value: 'bg-gradient-to-br from-amber-400 to-yellow-500' },
    { name: 'Midnight', value: 'bg-gradient-to-br from-slate-800 to-slate-900' },
    { name: 'Rose', value: 'bg-gradient-to-br from-pink-400 to-rose-500' },
  ];

  // Text color options
  const textColorOptions = [
    { name: 'White', value: 'text-white' },
    { name: 'Black', value: 'text-slate-900' },
    { name: 'Cream', value: 'text-amber-50' },
    { name: 'Dark Gray', value: 'text-slate-700' },
  ];

  // Text style options
  const textStyleOptions = [
    { name: 'Normal', value: 'font-normal' },
    { name: 'Bold', value: 'font-bold' },
    { name: 'Italic', value: 'italic' },
    { name: 'Bold Italic', value: 'font-bold italic' },
  ];

  const handlePost = async () => {
    if (!reflectionText.trim() && !selectedFile) {
      setError('Please enter some text or select a file');
      return;
    }

    setIsPosting(true);
    setError('');

    try {
      const currentMood = user?.mood ?? 1;
      console.log('[AddReflectionModal] Creating post with mood:', currentMood, 'User mood:', user?.mood);
      
      const postData = {
        content: reflectionText,
        type: 'story', // Reflections are saved as stories
        mood_at_time: currentMood, // Use user's current mood (0-3), default to 1 (Just... okay)
        // Add style metadata
        style: {
          backgroundColor,
          textColor,
          textStyle
        }
      };

      // If there's a file, convert it to base64
      if (selectedFile) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        
        const base64Data = await base64Promise;
        
        // Determine if it's an image or video based on file type
        if (selectedFile.type.startsWith('image/')) {
          postData.image_url = base64Data;
        } else if (selectedFile.type.startsWith('video/')) {
          postData.video_url = base64Data;
        }
        
        console.log('Uploading file:', selectedFile.name, 'type:', selectedFile.type, 'size:', base64Data.length);
      }

      await feedService.createPost(postData);
      
      // Close modal and reset
      onClose();
      setReflectionText('');
      setSelectedFile(null);
      setBackgroundColor('bg-gradient-to-br from-indigo-500 to-purple-600');
      setTextColor('text-white');
      setTextStyle('font-normal');
      
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
          <h2 className="text-xl font-extrabold text-slate-800">Add a Reflection</h2>
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
          
          {/* Preview Card */}
          <div className={`${backgroundColor} ${textColor} ${textStyle} p-6 rounded-2xl mb-4 min-h-[120px] flex items-center justify-center text-center shadow-lg transition-all duration-300`}>
            <p className="text-lg leading-relaxed">
              {reflectionText || 'Your reflection will appear here...'}
            </p>
          </div>

          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            rows="4"
            placeholder="Share a reflection, a lesson learned, or a moment of gratitude..."
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            disabled={isPosting}
          />
          
          {/* Background Color Selector */}
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Palette className="w-4 h-4 mr-2 text-slate-600" />
              <label className="text-sm font-semibold text-slate-700">Background</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {backgroundOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBackgroundColor(option.value)}
                  className={`h-10 rounded-lg ${option.value} transition-all ${
                    backgroundColor === option.value 
                      ? 'ring-2 ring-slate-900 ring-offset-2 scale-105' 
                      : 'hover:scale-105'
                  }`}
                  title={option.name}
                />
              ))}
            </div>
          </div>

          {/* Text Color Selector */}
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Type className="w-4 h-4 mr-2 text-slate-600" />
              <label className="text-sm font-semibold text-slate-700">Text Color</label>
            </div>
            <div className="flex gap-2">
              {textColorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTextColor(option.value)}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-all ${
                    textColor === option.value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Text Style Selector */}
          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Text Style</label>
            <div className="grid grid-cols-2 gap-2">
              {textStyleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTextStyle(option.value)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                    textStyle === option.value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  } ${option.value}`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

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
          <Button primary onClick={handlePost} disabled={isPosting || (reflectionText.trim().length === 0 && !selectedFile)}>
            {isPosting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin inline" />
                Posting...
              </>
            ) : (
              'Share Reflection'
            )}
          </Button>
          <Button skip onClick={onClose} disabled={isPosting}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default AddReflectionModal;
