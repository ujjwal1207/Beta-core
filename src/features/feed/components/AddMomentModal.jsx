import React, { useState, useRef } from 'react';
import { X, ImageIcon, VideoIcon } from 'lucide-react';
import Button from '../../../components/ui/Button';

const AddMomentModal = ({ isOpen, onClose }) => {
  const [momentText, setMomentText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handlePost = () => {
    console.log("Posting moment:", momentText, "with file:", selectedFile?.name);
    // In a real app, this would send to a server
    onClose();
    setMomentText('');
    setSelectedFile(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("File selected:", file.name, file.type);
      setSelectedFile(file);
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
        <div className="p-6 overflow-y-auto flex-grow">
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            rows="6"
            placeholder="What's on your mind? Share an update, a lesson, or a win..."
            value={momentText}
            onChange={(e) => setMomentText(e.target.value)}
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
          <Button primary onClick={handlePost} disabled={momentText.trim().length === 0 && !selectedFile}>
            Post
          </Button>
          <Button skip onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default AddMomentModal;
