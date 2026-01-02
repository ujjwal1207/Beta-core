import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';

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
  const [selectedPerson, setSelectedPerson] = useState(null);  const [selectedConversation, setSelectedConversation] = useState(null);  const [isAddMomentModalOpen, setIsAddMomentModalOpen] = useState(false);
  const [isAddReflectionModalOpen, setIsAddReflectionModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  
  // User authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
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

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token is in URL (from Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
          // Store token in localStorage
          localStorage.setItem('access_token', tokenFromUrl);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Load onboarding answers from backend
        if (userData.onboarding_answers && Object.keys(userData.onboarding_answers).length > 0) {
          setOnboardingAnswers(userData.onboarding_answers);
        } else if (userData.sharer_insights && Object.keys(userData.sharer_insights).length > 0) {
          // Backwards compatibility: if only sharer_insights exists, populate onboarding answers
          const answers = {};
          if (userData.sharer_insights.youngerSelf) {
            answers['SHARER_TRACK_1'] = userData.sharer_insights.youngerSelf;
          }
          if (userData.sharer_insights.lifeLessons) {
            answers['SHARER_TRACK_2'] = userData.sharer_insights.lifeLessons;
          }
          if (userData.sharer_insights.societyChange) {
            answers['SHARER_TRACK_3'] = userData.sharer_insights.societyChange;
          }
          if (Object.keys(answers).length > 0) {
            setOnboardingAnswers(answers);
          }
        }
        
        // Only auto-navigate if not already on WELCOME or auth screens
        if (screen === 'WELCOME' || screen === 'LOGIN' || screen === 'SIGNUP') {
          setScreen('FEED');
        }
      } catch (error) {
        // User not authenticated - redirect to login
        setIsAuthenticated(false);
        setUser(null);
        // Force redirect to login if not already on public pages
        if (screen !== 'WELCOME' && screen !== 'LOGIN' && screen !== 'SIGNUP') {
          setScreen('LOGIN');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      setScreen('FEED');
      return response;
    } catch (error) {
      setAuthError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (userData) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const newUser = await authService.signup(userData);
      setUser(newUser);
      setIsAuthenticated(true);
      setScreen('FEED'); // Navigate to main feed
      return newUser;
    } catch (error) {
      setAuthError(error.message || 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setScreen('WELCOME');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user mood
  const updateUserMood = async (mood) => {
    try {
      const response = await userService.updateMood(mood);
      setUser(prev => ({ ...prev, mood: response.mood }));
      return response;
    } catch (error) {
      console.error('Update mood error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (profileUpdates) => {
    try {
      const updatedUser = await userService.updateProfile(profileUpdates);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Sync sharer insights to backend
  const syncSharerInsights = async () => {
    try {
      const sharerInsights = {
        youngerSelf: onboardingAnswers['SHARER_TRACK_1'] || '',
        lifeLessons: onboardingAnswers['SHARER_TRACK_2'] || [],
        societyChange: onboardingAnswers['SHARER_TRACK_3'] || '',
      };
      
      // Only sync if there's any data
      if (sharerInsights.youngerSelf || sharerInsights.lifeLessons.length > 0 || sharerInsights.societyChange) {
        await updateUserProfile({ 
          sharer_insights: sharerInsights,
          onboarding_answers: onboardingAnswers // Save all onboarding answers
        });
      }
    } catch (error) {
      console.error('Error syncing sharer insights:', error);
    }
  };

  // Sync all onboarding answers to backend whenever they change
  const syncOnboardingAnswers = async () => {
    try {
      // Only sync if user is authenticated and there are answers
      if (isAuthenticated && user && Object.keys(onboardingAnswers).length > 0) {
        await updateUserProfile({ 
          onboarding_answers: onboardingAnswers
        });
      }
    } catch (error) {
      console.error('Error syncing onboarding answers:', error);
    }
  };

  // Sync onboarding answers when they change
  useEffect(() => {
    if (isAuthenticated && user && Object.keys(onboardingAnswers).length > 0) {
      // Debounce the sync to avoid too many API calls
      const timeoutId = setTimeout(() => {
        syncOnboardingAnswers();
      }, 1000); // Wait 1 second after last change
      
      return () => clearTimeout(timeoutId);
    }
  }, [onboardingAnswers, isAuthenticated, user]);

  // Sync wisdom data when onboarding answers change (legacy support)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if any wisdom-related answers exist
      const hasWisdomData = onboardingAnswers['SHARER_TRACK_1'] || 
                           onboardingAnswers['SHARER_TRACK_2'] || 
                           onboardingAnswers['SHARER_TRACK_3'];
      
      if (hasWisdomData) {
        syncSharerInsights();
      }
    }
  }, [onboardingAnswers['SHARER_TRACK_1'], onboardingAnswers['SHARER_TRACK_2'], onboardingAnswers['SHARER_TRACK_3']]);

  const value = {
    screen,
    setScreen,
    previousScreen,
    setPreviousScreen,
    selectedPerson,
    setSelectedPerson,
    selectedConversation,
    setSelectedConversation,
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
    // Auth state and methods
    user,
    setUser,
    isAuthenticated,
    isLoading,
    authError,
    login,
    signup,
    logout,
    updateUserMood,
    updateUserProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
