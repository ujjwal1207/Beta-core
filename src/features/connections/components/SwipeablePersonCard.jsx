import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { UserPlus, Calendar } from 'lucide-react';
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
        <div className="relative w-full text-white p-4 sm:p-6">
          <div className="flex items-center mb-2">
            <button onClick={handleNameClick} className="text-left touch-manipulation">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight inline active:underline">
                {person.name}, {person.age}
              </h2>
              <MoodDisplay moodIndex={person.mood} />
              <p className="text-xs sm:text-sm font-medium opacity-80">{person.role}</p>
            </button>
          </div>
          <p className="text-xs sm:text-sm mt-1 mb-3 sm:mb-4 opacity-90 leading-snug line-clamp-3">{person.bio}</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {person.tags.slice(0, 5).map(tag => (
              <span key={tag} className="px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-white/20 backdrop-blur-sm text-white rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button onClick={() => onAction(person, 'connect')} primary className="flex-1 !bg-white !text-slate-800 !text-sm sm:!text-base !py-2.5 sm:!py-3 touch-manipulation">
              <UserPlus className="w-4 h-4 inline mr-1 sm:mr-2 text-indigo-500"/> Connect
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex-1 !text-sm sm:!text-base !py-2.5 sm:!py-3 touch-manipulation">
              <Calendar className="w-4 h-4 inline mr-1 sm:mr-2"/> Schedule Call
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
