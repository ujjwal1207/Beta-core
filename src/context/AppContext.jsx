import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [screen, setScreen] = useState('WELCOME');
  const [previousScreen, setPreviousScreen] = useState('FEED');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isAddMomentModalOpen, setIsAddMomentModalOpen] = useState(false);
  const [isAddReflectionModalOpen, setIsAddReflectionModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  
  const [profileData, setProfileData] = useState({
    name: '',
    organization: '',
    topics: [],
    isProfileBasicCompleted: false,
    isModalOpen: false,
    lastCompletedStepKey: null,
    location: '',
    industry: '',
    expertise: '',
    exploring: '',
  });
  
  const [onboardingAnswers, setOnboardingAnswers] = useState({});

  const value = {
    screen,
    setScreen,
    previousScreen,
    setPreviousScreen,
    selectedPerson,
    setSelectedPerson,
    profileData,
    setProfileData,
    onboardingAnswers,
    setOnboardingAnswers,
    isAddMomentModalOpen,
    setIsAddMomentModalOpen,
    isAddReflectionModalOpen,
    setIsAddReflectionModalOpen,
    viewingStory,
    setViewingStory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
