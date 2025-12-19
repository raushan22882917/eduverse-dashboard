/**
 * Utility functions for generating session names based on prompts
 */

/**
 * Generates a session name using the first three letters of the prompt
 * @param prompt - The user's prompt/topic
 * @returns A formatted session name
 */
export const generateSessionName = (prompt: string): string => {
  if (!prompt || prompt.trim().length === 0) {
    return 'GEN'; // Default for empty prompts
  }

  // Clean the prompt: remove special characters and extra spaces
  const cleanPrompt = prompt.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ');
  
  // Extract first three letters (alphabetic characters only)
  const letters = cleanPrompt.replace(/[^a-zA-Z]/g, '').toUpperCase();
  
  if (letters.length === 0) {
    return 'NUM'; // For prompts with no letters (numbers only)
  }
  
  // Take first three letters, pad with 'X' if less than 3
  const sessionCode = (letters.substring(0, 3) + 'XXX').substring(0, 3);
  
  return sessionCode;
};

/**
 * Generates a unique session ID with the session name prefix
 * @param prompt - The user's prompt/topic
 * @returns A unique session ID with name prefix
 */
export const generateSessionId = (prompt: string): string => {
  const sessionName = generateSessionName(prompt);
  const timestamp = Date.now();
  return `${sessionName}-${timestamp}`;
};

/**
 * Extracts the session name from a session ID
 * @param sessionId - The session ID
 * @returns The session name part
 */
export const extractSessionName = (sessionId: string): string => {
  const parts = sessionId.split('-');
  return parts[0] || 'UNK';
};

/**
 * Formats session name for display
 * @param sessionName - The session name code
 * @returns Formatted display name
 */
export const formatSessionNameForDisplay = (sessionName: string): string => {
  return sessionName.replace(/X+$/, ''); // Remove trailing X's for display
};

// Examples of how it works:
// "Mathematics homework" -> "MAT"
// "Physics problems" -> "PHY" 
// "Chemistry lab" -> "CHE"
// "Biology study" -> "BIO"
// "English essay" -> "ENG"
// "History notes" -> "HIS"
// "123 numbers" -> "NUM"
// "" -> "GEN"
// "AI" -> "AIX"