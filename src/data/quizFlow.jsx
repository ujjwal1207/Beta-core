// Quiz flow configuration and logic
import React from 'react';
import { 
  BookOpen, Briefcase, Frown, Calendar, Heart, HelpCircle, Lock, 
  Edit3, Zap, Users, Smile, Clock, CheckCircle, X, User, MessageSquare,
  Home, Phone, Search
} from 'lucide-react';

// Icon Components
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

export const quizFlow = {
  'VIBE_QUIZ': {
    prompt: "What's bringing you here today?",
    allowMultiple: false,
    options: [
      { id: 'KNOWLEDGE_SHARER', text: "I'm here to share my knowledge and experiences.", icon: <IconKnowledgeSharer /> },
      { id: 'CAREER_GROWTH', text: "I'm focused on my next career step, but not sure what it is.", icon: <IconCareerGrowth /> },
      { id: 'BURNOUT_BALANCE', text: "Feeling the blur... just trying to find work-life *sanity*.", icon: <IconBurnout /> },
      { id: 'IMPOSTOR_PRESSURE', text: "Dealing with pressure, impostor feelings, or just feeling 'stuck'.", icon: <IconPressure /> },
      { id: 'REAL_CONNECTION', text: "Honestly? I just want real, non-performative conversations.", icon: <IconRealConnection /> },
      { id: 'JUST_LISTENING', text: "I'm here to listen and take in other perspectives for now.", icon: <IconListen /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => {
      if (selectedIds.includes('KNOWLEDGE_SHARER')) return 'SHARER_TRACK_1';
      if (selectedIds.includes('IMPOSTOR_PRESSURE')) return 'TRACK_PRESSURE_1';
      if (selectedIds.includes('BURNOUT_BALANCE')) return 'TRACK_BALANCE_1';
      if (selectedIds.includes('CAREER_GROWTH')) return 'TRACK_CAREER_1';
      if (selectedIds.includes('REAL_CONNECTION')) return 'TRACK_CONNECTION_1';
      if (selectedIds.includes('JUST_LISTENING')) return 'TRACK_LISTENER_1';
      return 'NEW_GENERATION';
    }
  },

  'SHARER_TRACK_1': {
    type: 'PROFILE_BUILDER',
    prompt: "That's wonderful! This space is built on sharing wisdom. Let's start with a big one:",
    question: "What insights would you give to your younger self?",
    inputLabel: "Your insights...",
    placeholder: "e.g., 'Don't be afraid to take that risk,' or 'Focus more on people than on titles...'",
    nextStepLogic: (textInput, allAnswers) => 'SHARER_TRACK_2'
  },
  'SHARER_TRACK_2': {
    type: 'EXPERIENCE_BUILDER',
    prompt: "Deep insights often come from experience. Let's add one or two key ones.",
    question: "Add your key work/life experiences and lessons.",
    nextStepLogic: (experiences, allAnswers) => 'SHARER_TRACK_3'
  },
  'SHARER_TRACK_3': {
    type: 'PROFILE_BUILDER',
    prompt: "Looking forward, what's a change you're passionate about?",
    question: "What change do you want to see in the human society?",
    inputLabel: "The change you hope for...",
    placeholder: "e.g., 'More empathy in the workplace,' or 'Better access to education for everyone...'",
    nextStepLogic: (textInput, allAnswers) => 'NEW_GENERATION'
  },

  'TRACK_CAREER_1': {
    prompt: "You're focused on your career. What does that 'next step' feel like?",
    allowMultiple: true,
    options: [
      { id: 'CAREER_CLIMB', text: "Climbing the ladder (promotion, new role).", icon: <Briefcase className="text-blue-500 w-6 h-6" /> },
      { id: 'CAREER_PIVOT', text: "Switching fields entirely (a big pivot).", icon: <IconCareerSwitch /> },
      { id: 'CAREER_HUSTLE', text: "Building my own thing (side-hustle or startup).", icon: <IconBusiness /> },
      { id: 'CAREER_WORTH', text: "Just... more money (negotiating my worth).", icon: <IconNegotiation /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'TRACK_CAREER_2'
  },
  'TRACK_CAREER_2': {
    prompt: "When you look for career advice, what's most helpful?",
    allowMultiple: false,
    options: [
      { id: 'ADVICE_TIPS', text: "Practical, actionable tips (the 'how-to').", icon: <CheckCircle className="text-green-500 w-6 h-6" /> },
      { id: 'ADVICE_FAILURE', text: "Honest stories of failure (what *not* to do).", icon: <X className="text-rose-500 w-6 h-6" /> },
      { id: 'ADVICE_MENTOR', text: "Finding a mentor who's 1-2 steps ahead.", icon: <User className="text-indigo-500 w-6 h-6" /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'NEW_GENERATION'
  },

  'TRACK_BALANCE_1': {
    prompt: "That 'work-life sanity' is the real goal. Where's the friction for you?",
    allowMultiple: true,
    options: [
      { id: 'FRICTION_OFF_SWITCH', text: "Can't 'turn off' (digital-first, always on).", icon: <Phone className="text-slate-500 w-6 h-6" /> },
      { id: 'FRICTION_BOUNDARIES', text: "Setting boundaries (with my boss, team, or self!).", icon: <IconBoundaries /> },
      { id: 'FRICTION_BURNOUT', text: "Too much work, too little time (the classic burnout).", icon: <IconToxic /> },
      { id: 'FRICTION_LIFE', text: "My 'life' part needs more... life (finding hobbies, friends).", icon: <Heart className="text-pink-500 w-6 h-6" /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'TRACK_BALANCE_2'
  },
  'TRACK_BALANCE_2': {
    prompt: "What kind of support are you looking for here?",
    allowMultiple: false,
    options: [
      { id: 'SUPPORT_VENT', text: "Just to vent with people who *get it*.", icon: <MessageSquare className="text-amber-600 w-6 h-6" /> },
      { id: 'SUPPORT_TIPS', text: "Real tips for setting boundaries that *actually* work.", icon: <CheckCircle className="text-green-500 w-6 h-6" /> },
      { id: 'SUPPORT_STORIES', text: "Stories of people who've recovered from burnout.", icon: <IconFitness /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'NEW_GENERATION'
  },

  'TRACK_PRESSURE_1': {
    prompt: "That's real, and you're not alone in that. What's this pressure feel like for you?",
    allowMultiple: true,
    options: [
      { id: 'PRESSURE_IMPOSTOR', text: "Classic impostor syndrome ('I'll be found out').", icon: <IconImpostor /> },
      { id: 'PRESSURE_SUCCEED', text: "Pressure to 'succeed' (from family, society, myself).", icon: <Zap className="text-yellow-500 w-6 h-6" /> },
      { id: 'PRESSURE_COMPARE', text: "Comparing my journey to everyone else's highlight reel.", icon: <Users className="text-indigo-500 w-6 h-6" /> },
      { id: 'PRESSURE_STUCK', text: "Analysis paralysis (stuck, can't make a choice).", icon: <HelpCircle className="text-slate-500 w-6 h-6" /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'TRACK_PRESSURE_2'
  },
  'TRACK_PRESSURE_2': {
    prompt: "When you're in that headspace, what helps you get out?",
    allowMultiple: false,
    options: [
      { id: 'HEADSPACE_VALIDATION', text: "Hearing I'm not the only one (validation).", icon: <Heart className="text-pink-500 w-6 h-6" /> },
      { id: 'HEADSPACE_HOBBY', text: "Getting out of my head (hobbies, exercise).", icon: <IconFitness /> },
      { id: 'HEADSPACE_TALK', text: "Talking to a trusted peer or mentor.", icon: <User className="text-indigo-500 w-6 h-6" /> },
      { id: 'HEADSPACE_NOTHING_YET', text: "Honestly, I'm still trying to figure that out.", icon: <Frown className="text-rose-500 w-6 h-6" /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'NEW_GENERATION'
  },

  'TRACK_CONNECTION_1': {
    prompt: "Yes. Less performance, more real talk. What kinds of conversations are you missing?",
    allowMultiple: true,
    options: [
      { id: 'CONVO_BIG_PICTURE', text: "The 'big picture' stuff (values, meaning, what's it all for?).", icon: <BookOpen className="text-amber-600 w-6 h-6" /> },
      { id: 'CONVO_VULNERABLE', text: "Vulnerable shares (fears, failures, messy parts).", icon: <IconToxic /> },
      { id: 'CONVO_INTERESTS', text: "Shared interests (passions *outside* of work).", icon: <Smile className="text-yellow-500 w-6 h-6" /> },
      { id: 'CONVO_SUPPORT', text: "Support for a tough personal situation.", icon: <IconImpostor /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'TRACK_CONNECTION_2'
  },
  'TRACK_CONNECTION_2': {
    prompt: "And who do you find it easiest to open up to?",
    allowMultiple: false,
    options: [
      { id: 'OPEN_TO_STRANGERS', text: "Total strangers (a blank slate, no judgment).", icon: <User className="text-slate-500 w-6 h-6" /> },
      { id: 'OPEN_TO_PEERS', text: "People in the same field (shared context).", icon: <Briefcase className="text-blue-500 w-6 h-6" /> },
      { id: 'OPEN_TO_LIFESTAGE', text: "People in a similar *life* stage (e.g., new parent, new city).", icon: <Home className="text-purple-500 w-6 h-6" /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'NEW_GENERATION'
  },

  'TRACK_LISTENER_1': {
    prompt: "We love that. Great listeners are the heart of this. What topics are you most curious about?",
    allowMultiple: true,
    options: [
      { id: 'LISTEN_CAREER', text: "Career pivots and success stories.", icon: <IconCareerSwitch /> },
      { id: 'LISTEN_REAL', text: "The real, hard parts of the journey.", icon: <IconToxic /> },
      { id: 'LISTEN_WELLNESS', text: "How others manage stress and wellness.", icon: <IconFitness /> },
      { id: 'LISTEN_ALL', text: "Just browsing, open to anything.", icon: <Search className="text-slate-500 w-6 h-6" /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => 'NEW_GENERATION'
  },

  'NEW_GENERATION': {
    prompt: "It often helps to connect with people in a similar life stage. Where do you fit in?",
    allowMultiple: false,
    options: [
      { id: 'AGE_18_24', text: "18-24", icon: <Clock className='w-6 h-6 text-slate-500'/> },
      { id: 'AGE_25_34', text: "25-34", icon: <Clock className='w-6 h-6 text-slate-500'/> },
      { id: 'AGE_35_44', text: "35-44", icon: <Clock className='w-6 h-6 text-slate-500'/> },
      { id: 'AGE_45_PLUS', text: "45+", icon: <Clock className='w-6 h-6 text-slate-500'/> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => {
      if (allAnswers['VIBE_QUIZ']?.includes('KNOWLEDGE_SHARER')) {
        return null;
      }
      return 'GIVE_ADVICE_QUIZ';
    }
  },

  'GIVE_ADVICE_QUIZ': {
    prompt: "Thank you for sharing. This space is about giving, too. What parts of your journey do you feel open to sharing?",
    allowMultiple: true,
    options: [
      { id: 'GIVE_CAREER', text: "Career twists and turns (wins and lessons).", icon: <IconCareerSwitch /> },
      { id: 'GIVE_BALANCE', text: "My work-life balance journey (and fighting burnout).", icon: <IconBurnout /> },
      { id: 'GIVE_PRESSURE', text: "Getting through tough stuff (impostor feelings, pressure).", icon: <IconImpostor /> },
      { id: 'GIVE_CONNECTION', text: "Connecting and sharing real stories, big or small.", icon: <IconRealConnection /> },
      { id: 'GIVE_LISTEN', text: "Mostly listening, but open to sharing if it helps.", icon: <IconListen /> }
    ],
    nextStepLogic: (selectedIds, allAnswers) => null
  },
};

// Keys for progress tracking
export const TRACK_Q1_KEYS = ['TRACK_CAREER_1', 'TRACK_BALANCE_1', 'TRACK_CONNECTION_1', 'TRACK_PRESSURE_1', 'TRACK_LISTENER_1'];
export const SHARER_TRACK_KEYS = ['SHARER_TRACK_1', 'SHARER_TRACK_2', 'SHARER_TRACK_3'];
export const TRACK_STARTER_KEYS = [...TRACK_Q1_KEYS, 'SHARER_TRACK_1'];
export const TRACK_Q2_KEYS = ['TRACK_CAREER_2', 'TRACK_BALANCE_2', 'TRACK_CONNECTION_2', 'TRACK_PRESSURE_2'];
