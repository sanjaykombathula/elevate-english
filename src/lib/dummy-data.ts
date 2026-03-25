import { User, Question, Lesson, VocabWord, SpeakingPrompt, Achievement } from './types';

export const defaultUser: User = {
  id: '1',
  name: 'Rahul Sharma',
  email: 'rahul@example.com',
  college: 'JNTU Hyderabad',
  year: '3rd',
  branch: 'CSE',
  level: 'Intermediate',
  goal: 'Placement preparation',
  dailyTarget: 20,
  streak: 7,
  totalMarks: 485,
  placementReadinessScore: 72,
  grammarScore: 78,
  vocabularyScore: 65,
  speakingScore: 60,
  lessonsCompleted: 24,
  joinedDate: '2026-01-15',
  learningPath: 'Placement Ready Path',
  badges: ['streak-3', 'tasks-10', 'marks-100'],
};

export const grammarQuestions: Question[] = [
  { id: 'g1', lessonId: 'grammar-tenses', type: 'mcq', question: 'Choose the correct sentence:', options: ['He go to school every day.', 'He goes to school every day.', 'He going to school every day.', 'He gone to school every day.'], correctAnswer: 'He goes to school every day.', explanation: 'In simple present tense, third person singular subjects take "goes" (verb + s/es).', marks: 5, attemptsAllowed: 2 },
  { id: 'g2', lessonId: 'grammar-tenses', type: 'fill-blank', question: 'She ___ (complete) the project by tomorrow.', acceptedAnswers: ['will have completed', 'will complete'], correctAnswer: 'will have completed', explanation: 'Future perfect tense is used to describe an action that will be completed before a specific time in the future.', marks: 5, attemptsAllowed: 2 },
  { id: 'g3', lessonId: 'grammar-tenses', type: 'sentence-correction', question: 'Correct this sentence: "I have went to the market yesterday."', acceptedAnswers: ['I went to the market yesterday.', 'I went to the market yesterday'], correctAnswer: 'I went to the market yesterday.', explanation: '"Have went" is incorrect. Use simple past "went" with "yesterday" (a specific past time).', marks: 10, attemptsAllowed: 3 },
  { id: 'g4', lessonId: 'grammar-tenses', type: 'mcq', question: 'Which sentence uses the present perfect tense correctly?', options: ['I have seen that movie last week.', 'I have seen that movie.', 'I seen that movie.', 'I has seen that movie.'], correctAnswer: 'I have seen that movie.', explanation: 'Present perfect (have/has + past participle) is used without a specific past time reference.', marks: 5, attemptsAllowed: 2 },
  { id: 'g5', lessonId: 'grammar-articles', type: 'fill-blank', question: '___ Eiffel Tower is in Paris.', acceptedAnswers: ['The', 'the'], correctAnswer: 'The', explanation: 'Use "The" before specific/unique nouns. The Eiffel Tower is a specific landmark.', marks: 5, attemptsAllowed: 2 },
  { id: 'g6', lessonId: 'grammar-articles', type: 'mcq', question: 'Choose the correct article: "She is ___ honest person."', options: ['a', 'an', 'the', 'no article'], correctAnswer: 'an', explanation: '"Honest" starts with a vowel sound (the "h" is silent), so "an" is used.', marks: 5, attemptsAllowed: 2 },
  { id: 'g7', lessonId: 'grammar-prepositions', type: 'fill-blank', question: 'He has been working here ___ 2020.', acceptedAnswers: ['since', 'Since'], correctAnswer: 'since', explanation: '"Since" is used with a specific point in time. "For" is used with a duration.', marks: 5, attemptsAllowed: 2 },
  { id: 'g8', lessonId: 'grammar-prepositions', type: 'mcq', question: 'The book is ___ the table.', options: ['in', 'on', 'at', 'by'], correctAnswer: 'on', explanation: '"On" is used when something is on a surface.', marks: 5, attemptsAllowed: 2 },
  { id: 'g9', lessonId: 'grammar-voice', type: 'sentence-correction', question: 'Convert to passive voice: "The teacher teaches the students."', acceptedAnswers: ['The students are taught by the teacher.', 'The students are taught by the teacher'], correctAnswer: 'The students are taught by the teacher.', explanation: 'In passive voice, the object becomes the subject. Use "are + past participle + by".', marks: 10, attemptsAllowed: 3 },
  { id: 'g10', lessonId: 'grammar-voice', type: 'mcq', question: 'Which is the correct passive form of "They are building a house"?', options: ['A house is being built by them.', 'A house is built by them.', 'A house was being built by them.', 'A house has been built by them.'], correctAnswer: 'A house is being built by them.', explanation: 'Present continuous passive: is/are + being + past participle.', marks: 5, attemptsAllowed: 2 },
];

export const grammarLessons: Lesson[] = [
  { id: 'grammar-tenses', title: 'Mastering Tenses', category: 'Grammar', level: 'Intermediate', description: 'Learn all 12 tenses with examples and practice.', estimatedTime: '15 min', marksTotal: 25, questions: grammarQuestions.filter(q => q.lessonId === 'grammar-tenses'), icon: '⏰' },
  { id: 'grammar-articles', title: 'Articles (A, An, The)', category: 'Grammar', level: 'Beginner', description: 'Master the usage of articles in English.', estimatedTime: '10 min', marksTotal: 10, questions: grammarQuestions.filter(q => q.lessonId === 'grammar-articles'), icon: '📝' },
  { id: 'grammar-prepositions', title: 'Prepositions Made Easy', category: 'Grammar', level: 'Beginner', description: 'Learn when to use in, on, at, by, since, for.', estimatedTime: '10 min', marksTotal: 10, questions: grammarQuestions.filter(q => q.lessonId === 'grammar-prepositions'), icon: '📍' },
  { id: 'grammar-voice', title: 'Active & Passive Voice', category: 'Grammar', level: 'Intermediate', description: 'Convert between active and passive voice.', estimatedTime: '15 min', marksTotal: 15, questions: grammarQuestions.filter(q => q.lessonId === 'grammar-voice'), icon: '🔄' },
];

export const vocabWords: VocabWord[] = [
  { id: 'v1', word: 'Meticulous', meaning: 'Showing great attention to detail; very careful and precise', example: 'She was meticulous in her research, checking every source twice.', pronunciationHint: 'muh-TIK-yuh-luhs', synonyms: ['thorough', 'precise', 'careful'], antonyms: ['careless', 'sloppy'], level: 'Intermediate', category: 'Professional', interviewUsage: '"I am meticulous about code quality and testing."' },
  { id: 'v2', word: 'Pragmatic', meaning: 'Dealing with things sensibly and realistically', example: 'We need a pragmatic approach to solve this problem.', pronunciationHint: 'prag-MAT-ik', synonyms: ['practical', 'realistic', 'sensible'], antonyms: ['idealistic', 'impractical'], level: 'Intermediate', category: 'Professional', interviewUsage: '"I take a pragmatic approach to problem-solving."' },
  { id: 'v3', word: 'Resilient', meaning: 'Able to recover quickly from difficulties', example: 'The resilient team bounced back after the project setback.', pronunciationHint: 'rih-ZIL-yuhnt', synonyms: ['tough', 'adaptable', 'strong'], antonyms: ['fragile', 'weak'], level: 'Beginner', category: 'Personality', interviewUsage: '"I am resilient and can handle pressure well."' },
  { id: 'v4', word: 'Collaborate', meaning: 'Work jointly on an activity or project', example: 'Engineers collaborate with designers to build better products.', pronunciationHint: 'kuh-LAB-uh-rayt', synonyms: ['cooperate', 'partner', 'team up'], antonyms: ['compete', 'oppose'], level: 'Beginner', category: 'Teamwork', interviewUsage: '"I love to collaborate with cross-functional teams."' },
  { id: 'v5', word: 'Articulate', meaning: 'Express an idea clearly and fluently', example: 'She articulated her vision for the project perfectly.', pronunciationHint: 'ahr-TIK-yuh-layt', synonyms: ['express', 'communicate', 'convey'], antonyms: ['mumble', 'stutter'], level: 'Advanced', category: 'Communication', interviewUsage: '"I can articulate complex technical concepts to non-technical stakeholders."' },
  { id: 'v6', word: 'Initiative', meaning: 'The ability to act independently and take charge', example: 'He showed initiative by proposing a new system architecture.', pronunciationHint: 'ih-NISH-uh-tiv', synonyms: ['enterprise', 'drive', 'ambition'], antonyms: ['passivity', 'laziness'], level: 'Beginner', category: 'Professional', interviewUsage: '"I take initiative and don\'t wait to be told what to do."' },
  { id: 'v7', word: 'Proficient', meaning: 'Competent or skilled in doing something', example: 'She is proficient in Python and JavaScript.', pronunciationHint: 'pruh-FISH-uhnt', synonyms: ['skilled', 'expert', 'adept'], antonyms: ['incompetent', 'unskilled'], level: 'Intermediate', category: 'Skills', interviewUsage: '"I am proficient in full-stack development."' },
  { id: 'v8', word: 'Leverage', meaning: 'Use something to maximum advantage', example: 'We leveraged cloud computing to scale our application.', pronunciationHint: 'LEV-ur-ij', synonyms: ['utilize', 'exploit', 'capitalize'], antonyms: ['waste', 'ignore'], level: 'Advanced', category: 'Professional', interviewUsage: '"I leverage modern tools to improve team productivity."' },
];

export const speakingPrompts: SpeakingPrompt[] = [
  { id: 'sp1', category: 'Self Introduction', prompt: 'Introduce yourself to a hiring manager. Include your name, education, skills, and career goals.', expectedDuration: 60, marks: 20, tips: ['Start with a confident greeting', 'Mention your degree and specialization', 'Highlight 2-3 key skills', 'End with your career aspiration'], sampleResponse: 'Good morning! My name is Rahul Sharma. I am a third-year B.Tech student in Computer Science at JNTU Hyderabad. I have strong skills in Java, Python, and web development. I have completed two internships where I worked on real-world projects. My goal is to join a product-based company where I can contribute to innovative solutions.' },
  { id: 'sp2', category: 'HR Interview', prompt: 'Why should we hire you? What makes you the right candidate for this role?', expectedDuration: 60, marks: 20, tips: ['Connect your skills to the job requirements', 'Give specific examples', 'Show enthusiasm', 'Be confident but not arrogant'] },
  { id: 'sp3', category: 'HR Interview', prompt: 'Tell me about a challenging situation you faced and how you handled it.', expectedDuration: 60, marks: 20, tips: ['Use the STAR method', 'Be specific about the situation', 'Focus on your actions and results', 'Show what you learned'] },
  { id: 'sp4', category: 'Group Discussion', prompt: 'Topic: "AI will replace most software engineering jobs in the next 10 years." Share your views.', expectedDuration: 90, marks: 20, tips: ['Take a balanced stance', 'Support with examples', 'Acknowledge counterarguments', 'Conclude with a strong summary'] },
  { id: 'sp5', category: 'Project Explanation', prompt: 'Explain your final year project to a non-technical interviewer.', expectedDuration: 90, marks: 20, tips: ['Start with the problem statement', 'Explain in simple terms', 'Mention technologies used', 'Share the impact/results'] },
  { id: 'sp6', category: 'Pronunciation', prompt: 'Read aloud: "The entrepreneurial ecosystem in India has significantly evolved, with innovative startups leveraging artificial intelligence and machine learning to solve complex problems."', expectedDuration: 30, marks: 10, tips: ['Speak slowly and clearly', 'Emphasize key words', 'Maintain even pace', 'Don\'t rush'] },
];

export const achievements: Achievement[] = [
  { id: 'a1', title: '3-Day Streak', description: 'Practice for 3 consecutive days', icon: '🔥', unlocked: true, progress: 3, target: 3, category: 'Streak' },
  { id: 'a2', title: '7-Day Streak', description: 'Practice for 7 consecutive days', icon: '🔥', unlocked: true, progress: 7, target: 7, category: 'Streak' },
  { id: 'a3', title: '30-Day Streak', description: 'Practice for 30 consecutive days', icon: '💫', unlocked: false, progress: 7, target: 30, category: 'Streak' },
  { id: 'a4', title: '10 Tasks Done', description: 'Complete 10 learning tasks', icon: '✅', unlocked: true, progress: 10, target: 10, category: 'Tasks' },
  { id: 'a5', title: '50 Tasks Done', description: 'Complete 50 learning tasks', icon: '🏆', unlocked: false, progress: 24, target: 50, category: 'Tasks' },
  { id: 'a6', title: '100 Marks', description: 'Earn 100 total marks', icon: '💯', unlocked: true, progress: 100, target: 100, category: 'Marks' },
  { id: 'a7', title: '500 Marks', description: 'Earn 500 total marks', icon: '🌟', unlocked: false, progress: 485, target: 500, category: 'Marks' },
  { id: 'a8', title: 'Vocab Master', description: 'Learn 50 vocabulary words', icon: '📚', unlocked: false, progress: 18, target: 50, category: 'Vocabulary' },
  { id: 'a9', title: 'Interview Ready', description: 'Complete all HR interview modules', icon: '💼', unlocked: false, progress: 3, target: 10, category: 'Placement' },
  { id: 'a10', title: 'Grammar Guru', description: 'Score 90%+ in all grammar topics', icon: '📝', unlocked: false, progress: 2, target: 4, category: 'Grammar' },
];

export const dailyQuestions: Question[] = [
  { id: 'dq1', lessonId: 'daily', type: 'mcq', question: 'Choose the grammatically correct sentence:', options: ['Me and him went to the store.', 'He and I went to the store.', 'Him and I went to the store.', 'Me and he went to the store.'], correctAnswer: 'He and I went to the store.', explanation: 'Use subject pronouns (He, I) when they are the subject of the sentence.', marks: 5, attemptsAllowed: 2 },
  { id: 'dq2', lessonId: 'daily', type: 'mcq', question: 'What does "break the ice" mean?', options: ['To break something made of ice', 'To start a conversation in a social setting', 'To solve a difficult problem', 'To end a relationship'], correctAnswer: 'To start a conversation in a social setting', explanation: '"Break the ice" is an idiom meaning to initiate conversation or ease tension.', marks: 5, attemptsAllowed: 2 },
  { id: 'dq3', lessonId: 'daily', type: 'mcq', question: 'Which word is a synonym of "diligent"?', options: ['Lazy', 'Hardworking', 'Ignorant', 'Careless'], correctAnswer: 'Hardworking', explanation: '"Diligent" means showing careful and persistent effort – similar to hardworking.', marks: 5, attemptsAllowed: 2 },
  { id: 'dq4', lessonId: 'daily', type: 'fill-blank', question: 'Despite the heavy rain, they ___ (decide) to continue the journey.', acceptedAnswers: ['decided', 'Decided'], correctAnswer: 'decided', explanation: 'Simple past tense "decided" is correct here as it describes a completed past action.', marks: 5, attemptsAllowed: 2 },
  { id: 'dq5', lessonId: 'daily', type: 'fill-blank', question: 'The manager asked if I ___ (can) handle the responsibility.', acceptedAnswers: ['could', 'Could'], correctAnswer: 'could', explanation: 'In reported speech, "can" changes to "could".', marks: 5, attemptsAllowed: 2 },
  { id: 'dq6', lessonId: 'daily', type: 'mcq', question: 'Select the most appropriate word: "The candidate showed great ___ during the interview."', options: ['composure', 'anger', 'laziness', 'ignorance'], correctAnswer: 'composure', explanation: '"Composure" means calmness and self-control, which is valued in interviews.', marks: 5, attemptsAllowed: 2 },
  { id: 'dq7', lessonId: 'daily', type: 'mcq', question: '"Could you please elaborate on that?" is an example of:', options: ['Informal language', 'Formal/polite language', 'Slang', 'Technical jargon'], correctAnswer: 'Formal/polite language', explanation: 'Using "could you please" is a polite and formal way to make a request.', marks: 5, attemptsAllowed: 2 },
];

export const placementQuestions: Question[] = [
  { id: 'pq1', lessonId: 'placement-intro', type: 'mcq', question: 'Which is the best way to start a self-introduction in an interview?', options: ['"Hey, I\'m Rahul, what\'s up?"', '"Good morning! I am Rahul Sharma, a B.Tech student..."', '"My father is a businessman and my mother is a teacher..."', '"I was born in 1999 in Hyderabad..."'], correctAnswer: '"Good morning! I am Rahul Sharma, a B.Tech student..."', explanation: 'Start with a professional greeting, then your name and current status. Avoid personal family details or casual language.', marks: 5, attemptsAllowed: 2 },
  { id: 'pq2', lessonId: 'placement-intro', type: 'sentence-correction', question: 'Correct this response: "My strength is I am very much hardworking and I do the works very fastly."', acceptedAnswers: ['My strength is that I am hardworking and I complete tasks efficiently.', 'My strength is that I am hardworking and I complete tasks efficiently'], correctAnswer: 'My strength is that I am hardworking and I complete tasks efficiently.', explanation: '"Very much" is redundant, "works" should be "tasks", and "fastly" is not a word – use "quickly" or "efficiently".', marks: 10, attemptsAllowed: 3 },
  { id: 'pq3', lessonId: 'placement-strengths', type: 'mcq', question: 'Which is the best answer to "What is your weakness?"', options: ['"I don\'t have any weakness."', '"I am a perfectionist." (without elaboration)', '"I sometimes spend extra time on code reviews, but I\'m learning to balance thoroughness with deadlines."', '"I am very lazy sometimes."'], correctAnswer: '"I sometimes spend extra time on code reviews, but I\'m learning to balance thoroughness with deadlines."', explanation: 'Show self-awareness with a genuine weakness and demonstrate how you\'re actively improving.', marks: 5, attemptsAllowed: 2 },
  { id: 'pq4', lessonId: 'placement-strengths', type: 'mcq', question: 'In a group discussion, what should you do if you disagree with someone?', options: ['"You are completely wrong."', '"I understand your perspective, however, I believe..."', 'Stay silent and don\'t express your opinion', '"That\'s a stupid point."'], correctAnswer: '"I understand your perspective, however, I believe..."', explanation: 'Acknowledge the other person\'s view before presenting your counterpoint. This shows maturity and communication skills.', marks: 5, attemptsAllowed: 2 },
];

export const mockTestQuestions: Question[] = [
  ...dailyQuestions.slice(0, 3).map((q, i) => ({ ...q, id: `mt${i + 1}`, lessonId: 'mock-grammar' })),
  { id: 'mt4', lessonId: 'mock-vocab', type: 'mcq', question: 'What is the meaning of "ubiquitous"?', options: ['Rare', 'Present everywhere', 'Dangerous', 'Beautiful'], correctAnswer: 'Present everywhere', explanation: '"Ubiquitous" means present, appearing, or found everywhere.', marks: 5, attemptsAllowed: 1 },
  { id: 'mt5', lessonId: 'mock-vocab', type: 'mcq', question: '"Ambiguous" is the opposite of:', options: ['Clear', 'Vague', 'Uncertain', 'Doubtful'], correctAnswer: 'Clear', explanation: '"Ambiguous" means unclear or having multiple meanings. Its opposite is "clear" or "unambiguous".', marks: 5, attemptsAllowed: 1 },
  { id: 'mt6', lessonId: 'mock-comm', type: 'fill-blank', question: 'In a formal email, you should end with "___ regards" instead of just "bye".', acceptedAnswers: ['Kind', 'kind', 'Best', 'best', 'Warm', 'warm'], correctAnswer: 'Kind', explanation: 'Formal emails typically end with "Kind regards", "Best regards", or "Warm regards".', marks: 5, attemptsAllowed: 1 },
  { id: 'mt7', lessonId: 'mock-comm', type: 'mcq', question: 'Which phrase is most appropriate for a formal presentation?', options: ['"So basically, like, our project does..."', '"I would like to present our project, which focuses on..."', '"Yeah so we made this thing..."', '"Our project is, you know, about..."'], correctAnswer: '"I would like to present our project, which focuses on..."', explanation: 'Use formal, structured language in presentations. Avoid filler words like "basically", "like", "you know".', marks: 5, attemptsAllowed: 1 },
  { id: 'mt8', lessonId: 'mock-grammar', type: 'sentence-correction', question: 'Correct: "Their going to there house over they\'re."', acceptedAnswers: ["They're going to their house over there.", "They're going to their house over there"], correctAnswer: "They're going to their house over there.", explanation: "They're = they are, their = possessive, there = location.", marks: 10, attemptsAllowed: 1 },
];
