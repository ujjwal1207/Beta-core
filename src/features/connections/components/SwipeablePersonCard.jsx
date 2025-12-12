import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { MessageSquare, Calendar } from 'lucide-react';
import MoodDisplay from '../../../components/ui/MoodDisplay';
import StarBadge from '../../../components/ui/StarBadge';
import Button from '../../../components/ui/Button';
import ScheduleCallModal from './ScheduleCallModal';

const SwipeablePersonCard = ({ person, onAction, style, isTop }) => {
  const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleNameClick = () => {
    setPreviousScreen('CONNECTIONS_DASHBOARD');
    setSelectedPerson(person);
    setScreen('PROFILE_DETAIL');
  };

  const isSuperLinker = (person?.connections || 0) > 200 && (person?.trustScore || 0) >= 3.0;

  return (
    <>
      <div
        className={`absolute w-full h-full p-0 flex flex-col items-center justify-end rounded-2xl shadow-2xl bg-cover bg-center ${
          isTop ? 'z-10' : 'z-0'
        } touch-none overflow-hidden`}
        style={{ ...style, backgroundImage: `url(${person.image})`, cursor: isTop ? 'grab' : 'default' }}
      >
        <StarBadge isSuper={isSuperLinker} />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
        <div className="relative w-full text-white p-6">
          <div className="flex items-center mb-2">
            <button onClick={handleNameClick} className="text-left">
              <h2 className="text-2xl font-extrabold tracking-tight inline hover:underline">
                {person.name}, {person.age}
              </h2>
              <MoodDisplay moodIndex={person.mood} />
              <p className="text-sm font-medium opacity-80">{person.role}</p>
            </button>
          </div>
          <p className="text-sm mt-1 mb-4 opacity-90 leading-snug">{person.bio}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {person.tags.map(tag => (
              <span key={tag} className="px-3 py-1 text-xs font-semibold bg-white/20 backdrop-blur-sm text-white rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex space-x-3 pt-2">
            <Button onClick={() => onAction(person, 'chat')} primary className="flex-1 !bg-white !text-slate-800">
              <MessageSquare className="w-4 h-4 inline mr-2 text-indigo-500"/> Chat
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex-1">
              <Calendar className="w-4 h-4 inline mr-2"/> Schedule Call
            </Button>
          </div>
        </div>
      </div>
      <ScheduleCallModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        person={person} 
        setScreen={setScreen}
      />
    </>
  );
};

export default SwipeablePersonCard;
