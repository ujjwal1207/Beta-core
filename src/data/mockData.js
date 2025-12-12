// Mock data for people, call history, chat history, and topics

export const POPULAR_TOPICS = [
  'UX Design', 'Startups', 'Career Change', 'Remote Work', 
  'React Development', 'Financial Independence', 'Mindfulness', 
  'Product Management', 'Marketing Strategy'
];

export const CALL_HISTORY_DATA = [
  { id: 1, name: 'Dr. Chen', type: 'outgoing', date: 'Yesterday, 4:30 PM', duration: '5m 12s' },
  { id: 2, name: 'Laura B.', type: 'missed', date: 'Oct 6, 11:15 AM', duration: '' },
  { id: 3, name: 'Marcus H.', type: 'incoming', date: 'Oct 5, 2:00 PM', duration: '12m 3s' },
  { id: 4, name: 'Rajesh K.', type: 'outgoing', date: 'Oct 5, 9:00 AM', duration: '8m 45s' },
];

export const CHAT_HISTORY_DATA = [
  { id: 1, name: 'Eliza C.', message: 'That sounds like a great plan! Let\'s...', timestamp: '10m ago', unread: 2 },
  { id: 2, name: 'Sam J.', message: 'Yeah, I can send over the resources...', timestamp: '1h ago', unread: 0 },
  { id: 3, name: 'Ben F.', message: 'Perfect, thanks for the quick reply!', timestamp: 'Yesterday', unread: 0 },
  { id: 4, name: 'Alice Z.', message: 'Can you look at this design mockup?', timestamp: 'Oct 6', unread: 1 },
];

export const ALL_PEOPLE = [
  { 
    id: 1, name: 'Dr. Chen', age: 38, role: 'Zen Master (Wellness Coach)',
    bio: "After burning out as a clinical psychologist, I rediscovered my calling. Now I help high-performers find their 'off-switch' and build a life that actually *feels* good, not just one that looks good.",
    tags: ['Mindfulness', 'Burnout Recovery', 'Millennial', 'Coaching', 'Mental Wellness'],
    image: 'https://picsum.photos/seed/drchen/400/500', mood: 2,
    connections: 241, trustScore: 4.9,
    gratitude: [
      { from: "Laura B.", text: "Dr. Chen helped me see my burnout as a signal, not a failure. Her perspective was a true game-changer for my career pivot." },
      { from: "Sam J.", text: "In just one call, she gave me practical tools to manage my anxiety. Incredibly empathetic and wise. Worth every rupee." }
    ],
    sharerInsights: {
      youngerSelf: "That 'anxiety' you feel? It's not a weakness, it's a signal. Listen to it. It's trying to tell you what's important. Also, you don't have to have it all figured out by 30.",
      lifeLessons: [
        { lesson: "You can't hustle your way to happiness. True success is sustainable, and that requires boundaries. 'No' is a complete (and beautiful) sentence.", where: "My clinical psychology practice", when: "My late 20s / early 30s" }
      ],
      societyChange: "I want us to dismantle the 'cult of productivity' and build a world where our inherent value isn't tied to our output."
    }
  },
  { 
    id: 2, name: 'Rajesh K.', age: 30, role: 'Hustler (Founder @TechUp)',
    bio: "I'm a founder, which means I'm a professional at getting messy with new ideas and learning from what breaks. Happy to share the *real* story, not just the funding announcements.",
    tags: ['Startups', 'Tech', 'Student', 'Engineering', 'Funding'], 
    image: 'https://picsum.photos/seed/rajeshk/400/500', mood: 3,
    connections: 89, trustScore: 4.2,
    sharerInsights: {
      youngerSelf: "Just start. Your v1 is supposed to be embarrassing. If you're not embarrassed, you waited too long. Perfection is the enemy of progress.",
      lifeLessons: [
        { lesson: "My first product failed spectacularly. It taught me to love the *problem*, not my *solution*. That's the key to finding product-market fit.", where: "My first startup (TechUp v1)", when: "2 years ago" }
      ],
      societyChange: "More funding for under-represented founders. Ideas are distributed equally, opportunity is not. I want to help change that."
    }
  },
  { 
    id: 3, name: 'Laura B.', age: 26, role: 'The Great Pivot (Product Lead)',
    bio: "Made 'The Great Pivot' from finance to design, and it was the scariest, best thing I've ever done. If you're feeling stuck or dreaming of a change, I've been there.",
    tags: ['New Job', 'Design', 'Younger Crew', 'Career Change', 'Product Management'], 
    image: 'https://picsum.photos/seed/laurab/400/500', mood: 0,
    connections: 42, trustScore: 4.6,
    sharerInsights: {
      youngerSelf: "That 'safe' job you hate? It's riskier than you think. The 'what if' will haunt you way more than the 'oh well'. Take the leap.",
      lifeLessons: [
        { lesson: "Jumping from finance to design taught me that your identity isn't your job title. You are allowed to evolve and rewrite your story.", where: "My big career pivot", when: "Last year" }
      ],
      societyChange: "I want us to normalize career 'tours' instead of 'ladders'. It's okay to explore different worlds and build a unique, non-linear path."
    }
  },
  { 
    id: 4, name: 'Marcus H.', age: 45, role: 'Money Magician (Negotiator)',
    bio: "I've negotiated 6-figure deals and... I've also been laid off. Both taught me about worth. Now, I share what I've learned to help *everyone*, especially underrepresented folks, get paid what they deserve.",
    tags: ['Money Talk', 'Big Boss', 'Older Crew', 'Negotiation', 'Finance'], 
    image: 'https://picsum.photos/seed/marcush/400/500', mood: 2,
    connections: 312, trustScore: 4.8,
    gratitude: [
      { from: "Rajesh K.", text: "Marcus helped me prep for my seed round pitch. His advice on reframing our 'worth' wasn't just about money, it was about confidence. A total pro." },
      { from: "Anna R.", text: "I used his tactics to negotiate a 20% salary bump! He's direct, kind, and unbelievably sharp." }
    ],
    sharerInsights: {
      youngerSelf: "Stop trying to have the 'right' answer. Ask better questions. Your 10-year plan is useless, but your curiosity is priceless.",
      lifeLessons: [
        { lesson: "My biggest 'failure'—getting laid off—was the catalyst for my greatest growth. It taught me that my value isn't my job title.", where: "My first big corporate job", when: "About 15 years ago" },
        { lesson: "Kindness is the best networking tool. People remember how you made them feel, not just what you did.", where: "Throughout my entire career", when: "Ongoing" }
      ],
      societyChange: "True pay transparency. I want companies to stop hiding behind 'salary bands' and for people to talk openly about money. It's the fastest path to equity."
    }
  },
  { 
    id: 5, name: 'Sam J.', age: 24, role: 'Forever Student (Data Scientist)', 
    bio: 'I live nearby and want to meet people to talk about new tech ideas.', 
    tags: ['Data', 'Younger Crew', 'Local', 'React Development', 'Remote Work'], 
    image: 'https://picsum.photos/seed/samj/400/500', mood: 2,
    connections: 15, trustScore: 4.1,
    sharerInsights: {
      youngerSelf: "Don't just learn *what* to think. Learn *how* to think. And go talk to actual people... not just your computer screen.",
      lifeLessons: [
        { lesson: "I got obsessed with a complex algorithm, but the real breakthrough came from a simple conversation with a user. Taught me that data is just a story about people.", where: "My final year project", when: "6 months ago" }
      ],
      societyChange: "Ethical AI. We need to build tools that *empower* people, not just optimize them. The human should always be the one in the loop."
    }
  },
  { 
    id: 6, name: 'Eliza C.', age: 33, role: 'Community Champion (Marketing Director)', 
    bio: 'I run a local company and love helping people in my town. Lets share stories!', 
    tags: ['Marketing', 'Middle Crew', 'Local Hero', 'Marketing Strategy', 'Community'], 
    image: 'https://picsum.photos/seed/elizac/400/500', mood: 3,
    connections: 76, trustScore: 4.4,
    sharerInsights: {
      youngerSelf: "Stop waiting for permission. Your voice is stronger than you know. Use it to lift others up, and you'll find you lift yourself, too.",
      lifeLessons: [
        { lesson: "We ran a local campaign that flopped. Instead of blaming the market, we just *listened*. The community told us what they *actually* needed. Taught me: market *with* people, not *at* them.", where: "My local marketing role", when: "3 years ago" }
      ],
      societyChange: "I want to see more 'local heroes'. Real change starts on your street, not just on a global screen. Invest in your community."
    }
  },
  { 
    id: 7, name: 'Alice Z.', age: 25, role: 'Junior Designer', 
    bio: 'Focusing on accessibility in **UX Design**. Love discussing new tools.', 
    tags: ['UX Design', 'Design', 'Gen Z', 'Local'], 
    image: 'https://picsum.photos/seed/alicez/400/500', mood: 2,
    connections: 33, trustScore: 4.3,
    sharerInsights: {
      youngerSelf: "Your 'fresh eyes' are a superpower, not a weakness. Don't be afraid to ask 'why' in a room full of people who only talk 'how'.",
      lifeLessons: [
        { lesson: "I spent a day with a screen-reader user. It completely changed my design philosophy in 2 hours. Taught me accessibility isn't a feature, it's the foundation.", where: "My first design internship", when: "Last year" }
      ],
      societyChange: "A web that is truly, deeply, and beautifully accessible to *everyone*, regardless of ability."
    }
  },
  { 
    id: 8, name: 'Ben F.', age: 40, role: 'CTO', 
    bio: 'Building **Startups** in the fintech space. Always open to mentorship.', 
    tags: ['Startups', 'Tech', 'Millennial', 'Mentorship', 'Financial Independence'], 
    image: 'https://picsum.photos/seed/benf/400/500', mood: 3,
    connections: 112, trustScore: 4.5,
    sharerInsights: {
      youngerSelf: "The code you write is the *least* important part of your job. The team you build, the people you mentor... *that's* the real legacy.",
      lifeLessons: [
        { lesson: "I nearly burned out my best team chasing an impossible deadline. It was a failure of *my* leadership, not their skill. Taught me that a leader's first job is to protect their team.", where: "My first startup", when: "A decade ago" }
      ],
      societyChange: "More tech leaders who measure success by their team's well-being and growth, not just their product's velocity."
    }
  },
  { 
    id: 9, name: 'Chloe G.', age: 28, role: 'Remote Work Expert (DevOps)', 
    bio: 'Masters of efficient asynchronous team communication.', 
    tags: ['Remote Work', 'Tech', 'Millennial', 'Efficiency'], 
    image: 'https://picsum.photos/seed/chloeg/400/500', mood: 3,
    connections: 61, trustScore: 4.0,
    sharerInsights: {
      youngerSelf: "You don't have to be in the office to be 'seen'. Your work and your integrity will speak for you. Build your reputation on reliability, not just visibility.",
      lifeLessons: [
        { lesson: "Managing a fully remote team through a crisis taught me that 'asynchronous' doesn't mean 'disconnected'. You have to be *hyper-intentional* about creating connection.", where: "My current DevOps role", when: "Ongoing" }
      ],
      societyChange: "Work that fits your *life*, not a life that's forced to fit into an office. I want 'work from anywhere' to be the default, not the exception."
    }
  },
  { 
    id: 10, name: 'David W.', age: 52, role: 'Life Balance Guru',
    bio: "For 20 years, I climbed the corporate ladder until I hit a wall. Now, I'm a 'Life Balance Guru' (my kids' title, not mine) helping others find success *without* sacrificing their health or family.",
    tags: ['Wellness', 'Balance', 'Older Crew', 'Coaching'], 
    image: 'https://picsum.photos/seed/davidw/400/500', mood: 2,
    connections: 150, trustScore: 4.7,
    sharerInsights: {
      youngerSelf: "That promotion you're killing yourself for? In 10 years, you won't even remember the title. But you *will* remember the family dinners you missed. Go home.",
      lifeLessons: [
        { lesson: "My 'empty cup' moment came in the form of a panic attack in a board meeting. Boundaries aren't just 'nice-to-have'; they are a non-negotiable part of a healthy life.", where: "Corporate executive role", when: "My mid-40s" }
      ],
      societyChange: "I want us to see rest as a right, not a reward. You are not a machine. You don't need to 'earn' a break. You just need it."
    }
  },
  { 
    id: 11, name: 'Eleanor P.', age: 22, role: 'UX • Student', 
    text: "We are making a cool design project next week! Everyone can join. Ask me for the link.", 
    mood: 2,
    bio: "Just a UX student trying to make things that are easy to use and nice to look at. Always open to collaboration and coffee chats!",
    tags: ['UX Design', 'Student', 'Gen Z', 'Collaboration', 'Creative Projects'],
    image: 'https://picsum.photos/seed/eleanorp/400/500',
    connections: 12, trustScore: 4.0,
    sharerInsights: {
      youngerSelf: "Don't just network, build real friendships. The people you genuinely connect with are the ones who will be there for you, in and out of work.",
      lifeLessons: [
        { lesson: "My 'cool design project' is just a way to meet people. I've learned that doing the work, even a small project, is the best way to connect.", where: "University UX Club", when: "This semester" }
      ],
      societyChange: "I want to see more mentorship from seniors to students *before* we graduate. We have the ideas, they have the experience. Let's bridge that gap."
    }
  },
  { 
    id: 12, name: 'Anna R.', age: 29, role: 'Project Manager • Grad', 
    text: "We are looking for a software helper for our team. You need to know React and Firebase. Send me a message!", 
    mood: 3,
    bio: "Graduated PM, now wrangling timelines and teams. I'm obsessed with finding tools and processes that make everyone's life easier.",
    tags: ['Project Management', 'Hiring', 'React', 'Firebase', 'Millennial'],
    image: 'https://picsum.photos/seed/annar/400/500',
    connections: 55, trustScore: 4.3,
    sharerInsights: {
      youngerSelf: "It's okay to not have a 5-year plan. Your 'next step' often reveals itself only after you've taken the *first* step. Be curious, be open.",
      lifeLessons: [
        { lesson: "Managing a team taught me that leadership isn't about having all the answers. It's about asking the right questions and trusting your team to find them.", where: "My first PM role", when: "Last 2 years" }
      ],
      societyChange: "More human-centric project management. Let's stop obsessing over velocity charts and start obsessing over team well-being and sustainable pace."
    }
  },
  { 
    id: 13, name: 'Joseph C.', age: 23, role: 'Engineer • Student', 
    text: "Look at these great design tools I found. Link below!", 
    mood: 1,
    bio: "Engineering student who loves to code, but secretly has a passion for good design. Always tinkering with new tools.",
    tags: ['Engineering', 'Student', 'Design Tools', 'Gen Z', 'React Development'],
    image: 'https://picsum.photos/seed/josephc/400/500',
    connections: 21, trustScore: 3.9,
    sharerInsights: {
      youngerSelf: "Stop trying to learn 10 new frameworks at once. Pick one, get *really* good at it, and build something real. Deep knowledge beats wide, shallow knowledge every time.",
      lifeLessons: [
        { lesson: "I went down a rabbit hole for a week on a 'great design tool' only to realize it didn't solve the core problem. Taught me to always start with 'why', not 'what tool'.", where: "A recent hackathon", when: "Last month" }
      ],
      societyChange: "I want to see more open-source projects focused on social good, not just developer convenience. We have the skills to solve real problems."
    }
  },
];
