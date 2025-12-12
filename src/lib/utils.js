import React from 'react';
import { 
  BookOpen, 
  Briefcase, 
  Frown, 
  Calendar, 
  Heart, 
  HelpCircle, 
  Lock,
  Edit3,
  Zap,
  Smile,
  Users
} from 'lucide-react';

// Icon Components for quiz choices
export const IconNegotiation = () => <BookOpen className="text-amber-600 w-6 h-6" />;
export const IconCareerSwitch = () => <Briefcase className="text-blue-500 w-6 h-6" />;
export const IconToxic = () => <Frown className="text-red-500 w-6 h-6" />;
export const IconBusiness = () => <Calendar className="text-amber-700 w-6 h-6" />;
export const IconFitness = () => <Heart className="text-lime-500 w-6 h-6" />;
export const IconImpostor = () => <HelpCircle className="text-teal-500 w-6 h-6" />;
export const IconBoundaries = () => <Lock className="text-blue-500 w-6 h-6" />;
export const IconKnowledgeSharer = () => <Edit3 className="text-purple-500 w-6 h-6" />;
export const IconCareerGrowth = () => <Zap className="text-blue-500 w-6 h-6" />;
export const IconBurnout = () => <Smile className="text-yellow-500 w-6 h-6" />;
export const IconRealConnection = () => <Users className="text-green-500 w-6 h-6" />;
export const IconPressure = () => <Frown className="text-rose-500 w-6 h-6" />;
export const IconListen = () => <BookOpen className="text-purple-500 w-6 h-6" />;

// Check if a person is a Super ListenLinker
export const isSuperLinker = (person) => {
  return (person?.connections || 0) > 200 && (person?.trustScore || 0) >= 3.0;
};

// Format date helper
export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
};
