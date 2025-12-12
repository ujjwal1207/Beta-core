import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../../../components/ui/Button';

const BasicProfileModal = ({ isOpen, onClose, onSave, profileData }) => {
  const [name, setName] = useState(profileData.name || ''); 
  const [org, setOrg] = useState(profileData.organization || '');
  const [customTagline, setCustomTagline] = useState(profileData.customTagline || '');
  const [location, setLocation] = useState(profileData.location || '');
  const [industry, setIndustry] = useState(profileData.industry || '');
  const [expertise, setExpertise] = useState(profileData.expertise || '');
  const [exploring, setExploring] = useState(profileData.exploring || '');
  const [topics, setTopics] = useState(profileData.topics || []);
  
  const availableTopics = ['Career Growth', 'Tech', 'Startups', 'Creative Projects', 'Wellness', 'Books'];

  const handleSave = () => {
    onSave({ 
      name, 
      organization: org, 
      topics, 
      customTagline, 
      location,
      industry,
      expertise,
      exploring,
      isProfileBasicCompleted: true 
    });
    onClose();
  };
  
  if (!isOpen) return null;

  const toggleTopic = (topic) => {
    setTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-800">Complete Your Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Display Name</label>
            <input type="text" placeholder="e.g., Alex Johnson" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Company or Organization (Optional)</label>
            <input type="text" placeholder="e.g., Acme Inc. or Student" value={org} onChange={e => setOrg(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Status (Optional)</label>
            <input type="text" placeholder="e.g., 'Exploring new career paths'" value={customTagline} onChange={e => setCustomTagline(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Location (Optional)</label>
            <input type="text" placeholder="e.g., Mumbai, India" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Industry (Optional)</label>
            <input type="text" placeholder="e.g., Technology" value={industry} onChange={e => setIndustry(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">My Expertise (Optional)</label>
            <textarea
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
              rows="4"
              placeholder="e.g., 'Product Management, front-end development (React), building design systems...'"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Areas I'm Exploring (Optional)</label>
            <textarea
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
              rows="3"
              placeholder="e.g., 'AI in creative tools, mindfulness techniques, angel investing...'"
              value={exploring}
              onChange={(e) => setExploring(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Topics you're interested in:</label>
            <div className="flex flex-wrap gap-2">
              {availableTopics.map(topic => (
                <button key={topic} onClick={() => toggleTopic(topic)} className={`px-3 py-1.5 text-sm font-semibold rounded-full border transition-colors ${topics.includes(topic) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-200">
          <Button primary onClick={handleSave} disabled={!name}>Save & Continue</Button>
        </div>
      </div>
    </div>
  );
};

export default BasicProfileModal;
