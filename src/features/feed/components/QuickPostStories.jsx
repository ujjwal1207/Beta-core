import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { ALL_PEOPLE } from '../../../data/mockData';

const QuickPostStories = ({ setIsAddReflectionModalOpen, setViewingStory }) => {
  const stories = useMemo(() => [
    { name: 'Dr. Chen', isNew: true }, 
    { name: 'Rajesh K.', isNew: false }, 
    { name: 'Anna R.', isNew: true },
    { name: 'Joseph C.', isNew: false }, 
    { name: 'Laura B.', isNew: false }, 
    { name: 'Marcus H.', isNew: true },
  ].map(story => {
    const person = ALL_PEOPLE.find(p => p.name.startsWith(story.name.split(' ')[0]));
    return person ? { ...story, person } : null;
  }).filter(Boolean), []);

  return (
    <div className="w-full mb-4 pb-4 overflow-x-auto whitespace-nowrap border-b border-slate-200 hide-scrollbar">
      <div className="inline-block ml-2 text-center">
        <button
          onClick={() => setIsAddReflectionModalOpen(true)}
          className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-slate-400 bg-slate-100 hover:bg-slate-200 hover:border-slate-500 transition-all"
          aria-label="Add your story"
        >
          <Plus className="w-7 h-7 text-slate-500" />
        </button>
        <p className="text-xs text-slate-600 mt-1.5 font-medium">Reflections</p>
      </div>

      {stories.map((story) => (
        <div key={story.person.id} className="inline-block mx-2 text-center">
          <button
            onClick={() => setViewingStory(story.person)}
            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 p-0.5 ${story.isNew ? 'border-rose-500' : 'border-slate-300'}`}
            aria-label={`View story from ${story.name}`}
          >
            <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-700 overflow-hidden">
              <img 
                src={story.person.image.replace('/400/500','/100/100')} 
                alt={story.name} 
                className="w-full h-full object-cover" 
                onError={(e) => { 
                  e.target.style.display = 'none'; 
                  e.target.parentElement.innerHTML = story.name[0]; 
                }}
              />
            </div>
          </button>
          <p className="text-xs text-slate-600 mt-1.5 truncate max-w-[64px]">{story.name.split(' ')[0]}</p>
        </div>
      ))}
    </div>
  );
};

export default QuickPostStories;
