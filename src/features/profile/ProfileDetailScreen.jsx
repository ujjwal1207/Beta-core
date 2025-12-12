import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Users, ThumbsUp, Clock, Briefcase, Calendar, MessageSquare } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import MoodDisplay from '../../components/ui/MoodDisplay';
import ScheduleCallModal from '../connections/components/ScheduleCallModal';
import Button from '../../components/ui/Button';

const ProfileDetailScreen = () => {
  const { setScreen, selectedPerson: person, previousScreen } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    if (!person) {
      setScreen('CONNECTIONS_DASHBOARD');
    }
  }, [person, setScreen]);

  if (!person) return null;

  const isSuperLinker = (person?.connections || 0) > 200 && (person?.trustScore || 0) >= 3.0;

  return (
    <>
      <div className="flex flex-col h-full bg-slate-100">
        <div className="flex-grow overflow-y-auto pb-28">
          <div className="relative w-full h-64 bg-cover bg-center" style={{ backgroundImage: `url(${person.image})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <button onClick={() => setScreen(previousScreen || 'FEED')} className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors z-10">
              <ArrowLeft className="w-6 h-6" />
            </button>
            {isSuperLinker && (
              <div className="absolute top-4 right-4 flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg text-white font-bold text-sm">
                <Star className="w-5 h-5 mr-1.5 fill-white" />
                Super ListenLinker
              </div>
            )}
          </div>

          <div className="relative z-0 bg-white p-6 rounded-t-3xl shadow-xl -mt-16">
            <div className="flex items-center mb-1">
              <h1 className="text-3xl font-extrabold text-slate-800">{person.name}, {person.age}</h1>
              <MoodDisplay moodIndex={person.mood} />
            </div>
            <p className="text-base font-semibold text-indigo-600 mb-4">{person.role}</p>
            
            {isSuperLinker && (
              <div className="flex items-center space-x-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex-1 flex items-center">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500 mr-2.5" />
                  <div>
                    <p className="text-base font-bold text-slate-800">{person.trustScore} / 5.0</p>
                    <p className="text-xs font-medium text-slate-500">Trust Score</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="flex-1 flex items-center">
                  <Users className="w-6 h-6 text-indigo-500 mr-2.5" />
                  <div>
                    <p className="text-base font-bold text-slate-800">{person.connections}</p>
                    <p className="text-xs font-medium text-slate-500">Connections</p>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-base text-slate-700 leading-relaxed mb-6">{person.bio}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {person.tags.map(tag => (
                <span key={tag} className="px-3 py-1 text-sm font-semibold bg-slate-200 text-slate-700 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {person.gratitude && person.gratitude.length > 0 && (
            <div className="bg-white p-6 mt-4 shadow-lg mx-0">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg mr-4">
                  <ThumbsUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800">Community Gratitude</h3>
              </div>
              <div className="space-y-4">
                {person.gratitude.map((item, index) => (
                  <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <blockquote className="text-base text-slate-700 italic mb-2">
                      "{item.text}"
                    </blockquote>
                    <p className="text-sm font-bold text-slate-600 text-right">
                      — {item.from}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {person.sharerInsights && (
            <div className="bg-white p-6 mt-4 shadow-lg mx-0">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg mr-4">
                  <ThumbsUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800">My Shared Wisdom</h3>
              </div>
              
              {person.sharerInsights.youngerSelf && (
                <div className="mb-6">
                  <div className="flex items-center text-sm font-bold text-slate-600 mb-2">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    ADVICE TO MY YOUNGER SELF
                  </div>
                  <blockquote className="text-base text-slate-700 italic border-l-4 border-indigo-200 pl-4 py-2 bg-slate-50 rounded-r-lg">
                    "{person.sharerInsights.youngerSelf}"
                  </blockquote>
                </div>
              )}

              {person.sharerInsights.lifeLessons && Array.isArray(person.sharerInsights.lifeLessons) && (
                <div className="mb-6">
                  <div className="flex items-center text-sm font-bold text-slate-600 mb-3">
                    <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                    KEY LIFE LESSONS
                  </div>
                  <div className="space-y-4">
                    {person.sharerInsights.lifeLessons.map((exp, index) => (
                      <div key={index} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <p className="text-base font-semibold text-slate-800 italic mb-3">"{exp.lesson}"</p>
                        <div className="text-sm font-medium text-slate-500 space-y-1">
                          <div className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0" />
                            <span>Learned at: <span className="font-semibold text-slate-600">{exp.where}</span></span>
                          </div>
                          {exp.when && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0" />
                              <span>When: <span className="font-semibold text-slate-600">{exp.when}</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {person.sharerInsights.societyChange && (
                <div>
                  <div className="flex items-center text-sm font-bold text-slate-600 mb-2">
                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                    CHANGE I WANT TO SEE
                  </div>
                  <blockquote className="text-base text-slate-700 italic border-l-4 border-indigo-200 pl-4 py-2 bg-slate-50 rounded-r-lg">
                    "{person.sharerInsights.societyChange}"
                  </blockquote>
                </div>
              )}
            </div>
          )}
          
          <div className="h-12"></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-10">
          <div className="flex space-x-3">
            <Button onClick={() => setScreen('MESSAGE_DELIVERED')} primary className="flex-1 !bg-indigo-100 !text-indigo-700">
              <MessageSquare className="w-5 h-5 inline mr-2"/> Start Chat
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex-1 !bg-rose-500">
              <Calendar className="w-5 h-5 inline mr-2"/> Schedule Call
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

export default ProfileDetailScreen;
