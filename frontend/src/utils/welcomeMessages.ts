const WELCOME_MESSAGES = [
  "How can I help you today?",
  "What would you like to build today?",
  "Need help with coding?",
  "Ask me anything.",
  "Let's solve something together.",
  "Ready when you are.",
  "What can I help you create today?",
  "Working on something interesting?",
  "Need assistance with your project?",
  "Let's make today productive.",
  "Have a question?",
  "What's on your mind today?",
  "What are we building today?",
  "Need help debugging?",
  "How can UnifyAI assist you today?",
  "Let's get started.",
  "Need help with your enterprise data?",
  "Start a conversation...",
  "What can I do for you?",
  "Ask your next big idea.",
];

let lastIndex = -1;

export const getRandomWelcomeMessage = (): string => {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * WELCOME_MESSAGES.length);
  } while (newIndex === lastIndex && WELCOME_MESSAGES.length > 1);
  lastIndex = newIndex;
  return WELCOME_MESSAGES[newIndex];
};
