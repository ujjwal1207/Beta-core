import React, { useState, useMemo, useCallback } from 'react';
import { Search, Users, Star, MessageSquare, Calendar, Frown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import TopTabBar from '../../components/layout/TopTabBar';
import SwipeablePersonCard from './components/SwipeablePersonCard';
import ScheduleCallModal from './components/ScheduleCallModal';
import MoodDisplay from '../../components/ui/MoodDisplay';
import { ALL_PEOPLE, POPULAR_TOPICS } from '../../data/mockData';

// Swipeable People Screen
const SwipeablePeopleScreen = () => {
  const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();
  
  const sections = useMemo(() => [
    { title: 'People You Might Connect With', people: ALL_PEOPLE.filter(p => p.mood > 1) },
    { title: 'New Voices', people: ALL_PEOPLE.filter(p => p.age < 35 && p.id > 2) },
    { title: 'Nearby Connections', people: ALL_PEOPLE.filter(p => p.tags.includes('Local')) },
  ], []);

  return (
    <div className="flex flex-row overflow-x-auto w-full scroll-snap-x-mandatory hide-scrollbar">
      {sections.map((section, index) => (
        <div key={index} className="flex-shrink-0 w-full h-full scroll-snap-align-start flex">
          <div className="w-full p-0 flex justify-center items-start">
            <div className="flex flex-col items-center space-y-3 pb-12 w-full px-4">
              <h2 className="text-2xl font-bold text-slate-800 mt-4 pb-3 border-b-2 border-slate-200 w-full text-center max-w-sm mx-auto">
                {section.title}
              </h2>
              {section.people.map(person => (
                <div key={person.id} className="w-full max-w-sm mx-auto flex-shrink-0 relative" style={{ height: '65vh', minHeight: '420px' }}>
                  <div className="absolute w-full h-full">
                    <SwipeablePersonCard 
                      person={person} 
                      onAction={() => setScreen('MESSAGE_DELIVERED')} 
                      style={{ position: 'relative', transform: 'none' }} 
                      isTop={true}
                    />
                  </div>
                </div>
              ))}
              {section.people.length === 0 && (
                <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-sm mt-8">
                  <Users className="w-10 h-10 text-rose-500 mx-auto mb-4"/>
                  <p className="font-semibold text-base text-slate-700">That's everyone for now.</p>
                  <p className="text-sm text-slate-500 mt-1">Try another category or come back later.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Person Result Card Component
const PersonResultCard = ({ person }) => {
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
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center mb-3 w-full">
        <div className="w-12 h-12 rounded-full bg-cover bg-center mr-3 flex-shrink-0 relative">
          <img src={person.image.replace('/400/500','/100/100')} alt={person.name} className="w-12 h-12 rounded-full" />
          {isSuperLinker && (
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 bg-amber-400 rounded-full border-2 border-white">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <button onClick={handleNameClick} className="text-left">
            <div className='flex items-center'>
              <p className="font-semibold text-base text-slate-800 truncate hover:underline">{person.name}, {person.age}</p>
              <MoodDisplay moodIndex={person.mood} />
            </div>
            <p className="text-xs text-slate-500 truncate">{person.role}</p>
          </button>
        </div>
        <div className="flex space-x-2 ml-3 flex-shrink-0">
          <button 
            onClick={() => setScreen('MESSAGE_DELIVERED')} 
            className="p-2 rounded-lg bg-slate-100 text-indigo-600 hover:bg-slate-200"
          >
            <MessageSquare className="w-5 h-5"/>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="p-2 rounded-lg bg-slate-100 text-rose-500 hover:bg-slate-200"
          >
            <Calendar className="w-5 h-5"/>
          </button>
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

// Find Connection Screen
const FindConnectionScreen = () => {
  const defaultSuggestions = useMemo(() => ALL_PEOPLE.slice(0, 5), []); 
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(defaultSuggestions);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = useCallback((query) => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
      setResults(defaultSuggestions); 
      setSearchTerm(''); 
      setSearchPerformed(false); 
      return;
    }
    const filtered = ALL_PEOPLE.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.role.toLowerCase().includes(lowerQuery) || 
      p.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
    setResults(filtered); 
    setSearchTerm(query); 
    setSearchPerformed(true);
  }, [defaultSuggestions]);

  return (
    <div className="flex flex-col w-full bg-slate-50 p-4 pt-0">
      <div className='pt-4'>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-1">Find Someone</h1> 
        <p className="text-base text-slate-500 mb-4">Look for shared experiences or topics.</p>
        <div className="relative"> 
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="e.g., UX design, Startups..." 
            value={searchTerm} 
            onChange={e => handleSearch(e.target.value)} 
            className="w-full p-4 pl-12 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-sm"
          />
        </div>
      </div>
      {!searchPerformed && (
        <>
          <h3 className="text-base font-semibold text-slate-800 my-4">Popular Topics</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {POPULAR_TOPICS.slice(0, 6).map(topic => (
              <button 
                key={topic} 
                onClick={() => handleSearch(topic)} 
                className="px-3 py-1.5 text-sm font-semibold bg-white text-slate-700 border border-slate-300 rounded-full hover:bg-slate-100 shadow-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        </>
      )}
      <div className='flex-grow pt-4'>
        <h3 className="text-base font-semibold text-slate-800 mb-3">
          {searchPerformed ? `Found ${results.length} people for "${searchTerm}"` : 'Suggestions for You'}
        </h3>
        {results.length > 0 ? (
          <div className="space-y-0">{results.map(person => <PersonResultCard key={person.id} person={person} />)}</div>
        ) : (
          searchPerformed && (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
              <Frown className="w-10 h-10 text-slate-400 mx-auto mb-4"/>
              <p className="font-semibold text-base text-slate-700">No one matched that search.</p>
              <p className="text-sm text-slate-500 mt-1">Try a different or more general topic.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// Super ListenLinker Screen
const SuperListenLinkerScreen = () => {
  const superLinkers = useMemo(() => 
    ALL_PEOPLE.filter(p => (p.connections || 0) > 200 && (p.trustScore || 0) >= 3.0), 
  []);

  const SuperPersonCard = ({ person }) => {
    const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleNameClick = () => {
      setPreviousScreen('CONNECTIONS_DASHBOARD');
      setSelectedPerson(person);
      setScreen('PROFILE_DETAIL');
    };

    return (
      <>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center mb-3 w-full">
          <div 
            className="w-16 h-16 rounded-full bg-cover bg-center mr-4 flex-shrink-0" 
            style={{backgroundImage: `url(${person.image.replace('/400/500','/100/100')})`}}
          ></div>
          <div className="flex-grow min-w-0">
            <button onClick={handleNameClick} className="text-left">
              <div className='flex items-center'>
                <p className="font-semibold text-base text-slate-800 truncate hover:underline">{person.name}, {person.age}</p>
              </div>
              <p className="text-sm text-slate-500 truncate">{person.role}</p>
            </button>
            <div className="flex items-center space-x-3 mt-2">
              <div className="flex items-center text-xs font-medium text-slate-600">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
                <span><span className="font-bold text-slate-800">{person.trustScore}</span> Trust Score</span>
              </div>
              <div className="flex items-center text-xs font-medium text-slate-600">
                <Users className="w-4 h-4 text-indigo-500 mr-1" />
                <span><span className="font-bold text-slate-800">{person.connections}</span> Connections</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="p-2 rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 ml-3 flex-shrink-0"
          >
            <Calendar className="w-5 h-5"/>
          </button>
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

  return (
    <div className="flex flex-col w-full bg-slate-50 p-4 pt-0">
      <div className='pt-4'>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-1">Super ListenLinkers</h1> 
        <p className="text-base text-slate-500 mb-4">Our most trusted and experienced sharers, available for dedicated calls.</p>
      </div>
      <div className='flex-grow pt-4'>
        {superLinkers.length > 0 ? (
          <div className="space-y-0">{superLinkers.map(person => <SuperPersonCard key={person.id} person={person} />)}</div>
        ) : (
          <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
            <Star className="w-10 h-10 text-slate-400 mx-auto mb-4"/>
            <p className="font-semibold text-base text-slate-700">Coming Soon</p>
            <p className="text-sm text-slate-500 mt-1">We're still growing our community of Super ListenLinkers!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Connections Screen
const ConnectionsScreen = () => {
  const { setScreen } = useAppContext();
  const [mode, setMode] = useState('SWIPE'); // SWIPE, SEARCH, SUPER

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="CONNECTIONS_DASHBOARD" />
      <div className="flex-grow overflow-y-auto pt-[121px]">
        <div className="sticky top-0 w-full p-4 flex justify-center bg-slate-50/90 backdrop-blur-md z-10 border-b border-slate-200">
          <div className="flex bg-slate-200 p-1 rounded-full shadow-inner max-w-full">
            {['SWIPE', 'SEARCH', 'SUPER'].map(m => (
              <button 
                key={m} 
                onClick={() => setMode(m)} 
                className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap ${
                  mode === m ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600'
                }`}
              >
                {m === 'SWIPE' ? 'Discover' : m === 'SEARCH' ? 'Search' : 'Super'}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          {mode === 'SWIPE' && <SwipeablePeopleScreen />}
          {mode === 'SEARCH' && <FindConnectionScreen />}
          {mode === 'SUPER' && <SuperListenLinkerScreen />}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsScreen;
