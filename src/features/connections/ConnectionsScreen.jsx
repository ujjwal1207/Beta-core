import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Users, Star, MessageSquare, Calendar, Frown, Loader, Filter, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import TopTabBar from '../../components/layout/TopTabBar';
import SwipeablePersonCard from './components/SwipeablePersonCard';
import ScheduleCallModal from './components/ScheduleCallModal';
import IncomingRequests from './components/IncomingRequests';
import MoodDisplay from '../../components/ui/MoodDisplay';
import { POPULAR_TOPICS } from '../../data/mockData';
import connectionsService from '../../services/connectionsService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

// Swipeable People Screen
const SwipeablePeopleScreen = () => {
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  
  const showNotification = (message, type = 'success') => {
    // Clear any existing timeout to prevent premature clearing
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    const fetchDiscoveryPeople = async () => {
      try {
        setIsLoading(true);
        const data = await connectionsService.discover(20);
        setPeople(data);
      } catch (err) {
        setError('Failed to load discovery feed');
        console.error('Error fetching discovery:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscoveryPeople();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const sections = [{ title: 'People You Might Connect With', people }];

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <div className={`p-4 rounded-xl shadow-lg border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
              {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-blue-600" />}
              <p className="font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-row overflow-x-auto w-full scroll-snap-x-mandatory hide-scrollbar">
      {sections.map((section, index) => (
        <div key={index} className="flex-shrink-0 w-full h-full scroll-snap-align-start flex">
          <div className="w-full p-0 flex justify-center items-start">
            <div className="flex flex-col items-center space-y-3 pb-12 w-full px-3 sm:px-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-3 sm:mt-4 pb-2 sm:pb-3 border-b-2 border-slate-200 w-full text-center max-w-sm mx-auto">
                {section.title}
              </h2>
              {section.people.map(person => (
                <div key={person.id} className="w-full max-w-sm mx-auto flex-shrink-0">
                  <div className="relative w-full" style={{ height: '45vh', minHeight: '300px', maxHeight: '500px' }}>
                    <SwipeablePersonCard 
                      person={{
                        id: person.id,
                        name: person.full_name,
                        age: person.age,
                        role: person.role,
                        image: getAvatarUrlWithSize(person, 400),
                        mood: person.mood,
                        location: person.location,
                        tags: person.tags || [],
                        bio: person.bio,
                        trustScore: person.trust_score,
                      }} 
                      onAction={async () => {
                        try {
                          await connectionsService.sendRequest(person.id);
                          showNotification('Connection request sent! We\'ll let you know when they accept.', 'success');
                        } catch (error) {
                          console.error('Failed to send connection request:', error);
                          showNotification('Failed to send connection request. Please try again.', 'error');
                        }
                      }} 
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
    </>
  );
};

// Person Result Card Component
const PersonResultCard = ({ person }) => {
  const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  
  const showNotification = (message, type = 'success') => {
    // Clear any existing timeout to prevent premature clearing
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 3000);
  };
  
  const handleNameClick = () => {
    setPreviousScreen('CONNECTIONS_DASHBOARD');
    setSelectedPerson(person);
    setScreen('PROFILE_DETAIL');
  };
  
  const isSuperLinker = person.is_super_linker || false;

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <div className={`p-4 rounded-xl shadow-lg border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
              {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-blue-600" />}
              <p className="font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex items-center mb-3 w-full touch-manipulation">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-cover bg-center mr-3 flex-shrink-0 relative overflow-hidden">
          <img src={getAvatarUrlWithSize(person, 100)} alt={person.full_name} className="w-full h-full rounded-full object-cover" />
          {isSuperLinker && (
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 bg-amber-400 rounded-full border-2 border-white">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <button onClick={handleNameClick} className="text-left w-full">
            <div className='flex items-center gap-1'>
              <p className="font-semibold text-sm sm:text-base text-slate-800 truncate active:underline">{person.full_name}{person.age ? `, ${person.age}` : ''}</p>
              <MoodDisplay moodIndex={person.mood} />
            </div>
            <p className="text-xs text-slate-500 truncate">{person.role || 'No role specified'}</p>
          </button>
        </div>
        <div className="flex gap-2 ml-2 sm:ml-3 flex-shrink-0">
          <button 
            onClick={async () => {
              try {
                await connectionsService.sendRequest(person.id);
                showNotification('Connection request sent! We\'ll let you know when they accept.', 'success');
              } catch (error) {
                console.error('Failed to send connection request:', error);
                showNotification('Failed to send connection request. Please try again.', 'error');
              }
            }} 
            className="p-2 sm:p-2.5 rounded-lg bg-slate-100 text-indigo-600 active:bg-slate-200 touch-manipulation"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5"/>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="p-2 sm:p-2.5 rounded-lg bg-slate-100 text-rose-500 active:bg-slate-200 touch-manipulation"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5"/>
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
  const { searchQuery, setSearchQuery } = useAppContext();
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    company: '',
    school: '',
    expertise: '',
    location: '',
    industry: ''
  });

  const handleSearch = useCallback(async (query) => {
    const trimmedQuery = query.trim();
    
    // Check if we have any filters or query
    const hasActiveFilters = Object.values(filters).some(val => val.trim());
    
    if (!trimmedQuery && !hasActiveFilters) {
      setResults([]);
      // keep searchTerm so UI shows the query
      setSearchPerformed(false);
      return;
    }

    try {
      setIsLoading(true);
      setSearchTerm(query);
      setSearchPerformed(true);
      
      // Create clean filters object (only non-empty values)
      const activeFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key].trim()) {
          activeFilters[key] = filters[key].trim();
        }
      });
      
      const data = await connectionsService.search(trimmedQuery, 20, activeFilters);
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Auto-run when redirected with global searchQuery
  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      handleSearch(searchQuery);
      // Clear global query after consuming
      setSearchQuery('');
    }
  }, [searchQuery]);

  return (
    <div className="flex flex-col w-full bg-slate-50 p-3 sm:p-4 pt-0">
      <div className='pt-3 sm:pt-4'>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-1">Find Someone</h1> 
        <p className="text-sm sm:text-base text-slate-500 mb-3 sm:mb-4">Look for shared experiences or topics.</p>
        <div className="flex gap-2">
          <div className="relative flex-1"> 
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="e.g., UX design, Startups..." 
              value={searchTerm} 
              onChange={e => handleSearch(e.target.value)} 
              className="w-full p-3 sm:p-4 pl-10 sm:pl-12 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base shadow-sm touch-manipulation"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 sm:p-4 border rounded-xl transition-colors touch-manipulation ${
              showFilters 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white text-slate-700 border-slate-300 active:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 sm:mt-4 bg-white border border-slate-200 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
              <button
                onClick={() => {
                  setFilters({
                    role: '',
                    company: '',
                    school: '',
                    expertise: '',
                    location: '',
                    industry: ''
                  });
                  handleSearch(searchTerm);
                }}
                className="text-xs text-indigo-600 active:text-indigo-700 font-semibold touch-manipulation"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Role"
                value={filters.role}
                onChange={e => setFilters({...filters, role: e.target.value})}
                onBlur={() => handleSearch(searchTerm)}
                className="p-2.5 sm:p-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 touch-manipulation"
              />
              <input
                type="text"
                placeholder="Company"
                value={filters.company}
                onChange={e => setFilters({...filters, company: e.target.value})}
                onBlur={() => handleSearch(searchTerm)}
                className="p-2.5 sm:p-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 touch-manipulation"
              />
              <input
                type="text"
                placeholder="School"
                value={filters.school}
                onChange={e => setFilters({...filters, school: e.target.value})}
                onBlur={() => handleSearch(searchTerm)}
                className="p-2.5 sm:p-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 touch-manipulation"
              />
              <input
                type="text"
                placeholder="Expertise"
                value={filters.expertise}
                onChange={e => setFilters({...filters, expertise: e.target.value})}
                onBlur={() => handleSearch(searchTerm)}
                className="p-2.5 sm:p-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 touch-manipulation"
              />
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={e => setFilters({...filters, location: e.target.value})}
                onBlur={() => handleSearch(searchTerm)}
                className="p-2.5 sm:p-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 touch-manipulation"
              />
              <input
                type="text"
                placeholder="Industry"
                value={filters.industry}
                onChange={e => setFilters({...filters, industry: e.target.value})}
                onBlur={() => handleSearch(searchTerm)}
                className="p-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => handleSearch(searchTerm)}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        )}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            <h3 className="text-base font-semibold text-slate-800 mb-3">
              {searchPerformed ? `Found ${results.length} people for "${searchTerm}"` : 'Start searching...'}
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
          </>
        )}
      </div>
    </div>
  );
};

// Super ListenLinker Screen
const SuperListenLinkerScreen = () => {
  const [superLinkers, setSuperLinkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuperLinkers = async () => {
      try {
        setIsLoading(true);
        const data = await connectionsService.getSuperLinkers(20);
        setSuperLinkers(data);
      } catch (err) {
        console.error('Error fetching super linkers:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuperLinkers();
  }, []);

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
            className="w-16 h-16 rounded-full bg-cover bg-center mr-4 flex-shrink-0 overflow-hidden" 
            style={{backgroundImage: `url(${getAvatarUrlWithSize(person, 100)})`}}
          ></div>
          <div className="flex-grow min-w-0">
            <button onClick={handleNameClick} className="text-left">
              <div className='flex items-center'>
                <p className="font-semibold text-base text-slate-800 truncate hover:underline">{person.full_name}{person.age ? `, ${person.age}` : ''}</p>
              </div>
              <p className="text-sm text-slate-500 truncate">{person.role || 'No role specified'}</p>
            </button>
            <div className="flex items-center space-x-3 mt-2">
              <div className="flex items-center text-xs font-medium text-slate-600">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
                <span><span className="font-bold text-slate-800">{person.trust_score?.toFixed(1) || '0.0'}</span> Trust Score</span>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

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

// Alumni Screen
const AlumniScreen = () => {
  const [alumni, setAlumni] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        setIsLoading(true);
        const data = await connectionsService.getAlumni(50);
        setAlumni(data);
      } catch (err) {
        console.error('Error fetching alumni:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  const AlumniPersonCard = ({ person }) => {
    const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();
    
    const handleClick = () => {
      setPreviousScreen('CONNECTIONS_DASHBOARD');
      setSelectedPerson(person);
      setScreen('PROFILE_DETAIL');
    };

    // Get school(s) in common
    const getCommonSchools = () => {
      if (!person.education || person.education.length === 0) return [];
      return person.education.map(edu => edu.name).filter(Boolean);
    };

    const commonSchools = getCommonSchools();

    return (
      <div 
        onClick={handleClick}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center mb-3 w-full hover:border-indigo-300 transition-colors cursor-pointer"
      >
        <div 
          className="w-16 h-16 rounded-full bg-cover bg-center mr-4 flex-shrink-0 overflow-hidden" 
          style={{backgroundImage: `url(${getAvatarUrlWithSize(person, 100)})`}}
        >
          <img 
            src={getAvatarUrlWithSize(person, 100)} 
            alt={person.full_name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-800 truncate">{person.full_name}</h3>
          <p className="text-sm text-slate-600 truncate">{person.role || 'No role specified'}</p>
          {commonSchools.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-indigo-600 font-semibold">🎓 {commonSchools[0]}</span>
              {commonSchools.length > 1 && (
                <span className="text-xs text-slate-400">+{commonSchools.length - 1} more</span>
              )}
            </div>
          )}
        </div>
        <MoodDisplay mood={person.mood} size="sm" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-slate-50 p-4">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-1">Alumni Network</h1>
      <p className="text-base text-slate-500 mb-4">Connect with people from your schools</p>
      
      {alumni.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4"/>
          <p className="font-semibold text-base text-slate-700">No alumni found</p>
          <p className="text-sm text-slate-500 mt-1">Add schools to your profile to find alumni</p>
        </div>
      ) : (
        <>
          <h3 className="text-base font-semibold text-slate-800 mb-3">
            Found {alumni.length} {alumni.length === 1 ? 'person' : 'people'} from your schools
          </h3>
          <div className="space-y-0">
            {alumni.map(person => (
              <AlumniPersonCard key={person.id} person={person} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Main Connections Screen
const ConnectionsScreen = () => {
  const { setScreen, connectionsMode, setConnectionsMode } = useAppContext();
  const [mode, setMode] = useState(connectionsMode || 'SWIPE'); // SWIPE, SEARCH, ALUMNI, SUPER

  useEffect(() => {
    if (connectionsMode) {
      setMode(connectionsMode);
      // clear global mode after consuming
      setConnectionsMode(null);
    }
  }, [connectionsMode, setConnectionsMode]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="CONNECTIONS_DASHBOARD" />
      
      <div className="flex-grow overflow-y-auto pt-[121px]">
        {/* Mode Selector - constrained to app width */}
        <div className="w-full p-3 sm:p-4 flex justify-center bg-slate-50 border-b border-slate-200">
          <div className="flex bg-slate-200 p-1 rounded-full shadow-inner max-w-sm w-full">
            {['SWIPE', 'SEARCH', 'ALUMNI', 'SUPER'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 min-w-0 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold
                            rounded-full transition-all duration-300 whitespace-nowrap touch-manipulation ${
                  mode === m ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 active:bg-slate-300'
                }`}
              >
                {m === 'SWIPE' ? 'Discover' : m === 'SEARCH' ? 'Search' : m === 'ALUMNI' ? 'Alumni' : 'Super'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Incoming Requests Section - Only show on Discover tab */}
        {mode === 'SWIPE' && (
          <div className="pt-4">
            <IncomingRequests />
          </div>
        )}

        <div className="w-full">
          {mode === 'SWIPE' && <SwipeablePeopleScreen />}
          {mode === 'SEARCH' && <FindConnectionScreen />}
          {mode === 'ALUMNI' && <AlumniScreen />}
          {mode === 'SUPER' && <SuperListenLinkerScreen />}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsScreen;
