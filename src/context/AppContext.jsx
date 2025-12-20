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
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
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
      setScreen('QUIZ'); // Navigate to onboarding quiz
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
