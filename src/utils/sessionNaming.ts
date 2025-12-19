/**
 * Utility functions for generating ChatGPT-style session names based on conversation content
 */

/**
 * Generates a descriptive session name based on the prompt content (ChatGPT style)
 * @param prompt - The user's prompt/topic
 * @returns A descriptive session name
 */
export const generateSessionName = (prompt: string): string => {
  if (!prompt || prompt.trim().length === 0) {
    return 'New Chat';
  }

  // Clean and normalize the prompt
  const cleanPrompt = prompt.trim().toLowerCase();
  
  // Extract key topics and generate descriptive names
  const sessionName = extractTopicFromPrompt(cleanPrompt);
  
  // Capitalize first letter of each word
  return sessionName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Extracts the main topic from a prompt to create a descriptive session name (ChatGPT style)
 * @param prompt - The cleaned prompt text
 * @returns A descriptive topic name
 */
const extractTopicFromPrompt = (prompt: string): string => {
  // Common stop words to filter out
  const stopWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over',
    'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'cannot',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose',
    'please', 'help', 'can', 'need', 'want', 'like', 'get', 'make', 'take', 'give', 'tell', 'show', 'let', 'put'
  ];

  // Specific topic patterns that should be preserved
  const topicPatterns = {
    // Academic subjects
    'mathematics': ['math', 'mathematics', 'algebra', 'calculus', 'geometry', 'trigonometry', 'statistics'],
    'physics': ['physics', 'mechanics', 'thermodynamics', 'electromagnetism', 'quantum', 'relativity'],
    'chemistry': ['chemistry', 'organic', 'inorganic', 'biochemistry', 'molecular'],
    'biology': ['biology', 'genetics', 'ecology', 'anatomy', 'physiology', 'microbiology'],
    'computer science': ['programming', 'coding', 'algorithm', 'data structure', 'software', 'javascript', 'python', 'react', 'html', 'css'],
    'english': ['literature', 'grammar', 'writing', 'essay', 'poetry', 'novel'],
    'history': ['history', 'historical', 'ancient', 'medieval', 'modern', 'civilization'],
    
    // Common academic activities
    'calculation': ['calculate', 'computation', 'solve', 'equation', 'formula'],
    'explanation': ['explain', 'understand', 'concept', 'theory', 'principle'],
    'homework': ['homework', 'assignment', 'exercise', 'problem set'],
    'exam preparation': ['exam', 'test', 'quiz', 'preparation', 'review', 'study'],
    'research': ['research', 'analysis', 'investigation', 'study', 'experiment'],
    'tutorial': ['tutorial', 'guide', 'instruction', 'lesson', 'learning'],
    'project': ['project', 'assignment', 'work', 'task', 'development']
  };

  // Clean the prompt and split into words
  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));

  // Find the best matching topic
  let bestMatch = '';
  let maxMatches = 0;

  for (const [topic, keywords] of Object.entries(topicPatterns)) {
    const matches = keywords.filter(keyword => 
      words.some(word => word.includes(keyword) || keyword.includes(word))
    ).length;
    
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = topic;
    }
  }

  // If we found a good topic match, use it
  if (bestMatch && maxMatches > 0) {
    // Add specific context if available
    const contextWords = words
      .filter(word => !topicPatterns[bestMatch].some(keyword => 
        word.includes(keyword) || keyword.includes(word)
      ))
      .slice(0, 2);
    
    if (contextWords.length > 0) {
      return `${bestMatch} ${contextWords.join(' ')}`;
    }
    return bestMatch;
  }

  // Fallback: use the most meaningful words from the prompt
  const meaningfulWords = words
    .filter(word => word.length > 3) // Prefer longer words
    .slice(0, 3);

  if (meaningfulWords.length === 0) {
    // Use any remaining words
    const fallbackWords = words.slice(0, 2);
    return fallbackWords.length > 0 ? fallbackWords.join(' ') : 'general discussion';
  }

  return meaningfulWords.join(' ');
};

/**
 * Generates a unique session ID with timestamp
 * @param prompt - The user's prompt/topic (optional, used for naming)
 * @returns A unique session ID
 */
export const generateSessionId = (prompt?: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${randomSuffix}`;
};

/**
 * Formats session name for display (ChatGPT style)
 * @param sessionName - The session name
 * @returns Formatted display name
 */
export const formatSessionNameForDisplay = (sessionName: string): string => {
  // Limit length for display (like ChatGPT)
  if (sessionName.length > 30) {
    return sessionName.substring(0, 27) + '...';
  }
  return sessionName;
};

/**
 * Generates a session name from the first message in a conversation
 * @param firstMessage - The first message content
 * @returns A descriptive session name
 */
export const generateSessionNameFromMessage = (firstMessage: string): string => {
  return generateSessionName(firstMessage);
};

// Examples of how it works (ChatGPT style):
// "Help me with mathematics homework" -> "Mathematics Homework"
// "Explain magnetic field calculation" -> "Physics Calculation"
// "Chemistry lab report writing" -> "Chemistry Report"
// "Biology cell structure analysis" -> "Biology Structure"
// "JavaScript programming tutorial" -> "Computer Science Tutorial"
// "Ancient Rome history research" -> "History Research"
// "Solve quadratic equations step by step" -> "Mathematics Equation"
// "What is photosynthesis process?" -> "Biology Explanation"
// "React component development" -> "Computer Science Development"
// "English essay writing tips" -> "English Writing"
// "" -> "New Chat"