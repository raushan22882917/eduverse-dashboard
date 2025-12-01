/**
 * Utility to parse and format MCQ questions
 */

export interface MCQOption {
  label: string; // (a), (b), (c), etc.
  text: string; // The option text
}

export interface ParsedMCQ {
  isMCQ: boolean;
  questionText: string; // Question without options
  options: MCQOption[];
  questionNumber?: number;
}

/**
 * Parse MCQ question from text
 * Detects patterns like:
 * - (a) option text
 * - (b) option text
 * - etc.
 */
export function parseMCQ(questionText: string): ParsedMCQ {
  // Pattern to match MCQ options: (a), (b), (c), (d), etc.
  const optionPattern = /^\(([a-z])\)\s+(.+)$/im;
  
  // Split by lines and look for options
  const lines = questionText.split('\n');
  const options: MCQOption[] = [];
  let questionEndIndex = lines.length;
  let foundOptions = false;
  
  // Look for options starting from the end or after question markers
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    const match = line.match(optionPattern);
    
    if (match) {
      foundOptions = true;
      options.unshift({
        label: match[1].toUpperCase(),
        text: match[2].trim()
      });
      questionEndIndex = i;
    } else if (foundOptions && line.length > 0 && !line.match(/^[-*]/)) {
      // Stop if we hit non-option text after finding options
      break;
    }
  }
  
  // If we found at least 2 options, it's likely an MCQ
  if (options.length >= 2) {
    const questionText = lines.slice(0, questionEndIndex).join('\n').trim();
    
    // Extract question number if present (e.g., "1. Question text")
    const questionNumberMatch = questionText.match(/^(\d+)\./);
    const questionNumber = questionNumberMatch ? parseInt(questionNumberMatch[1]) : undefined;
    const cleanQuestionText = questionNumberMatch 
      ? questionText.replace(/^\d+\.\s*/, '').trim()
      : questionText;
    
    return {
      isMCQ: true,
      questionText: cleanQuestionText,
      options: options,
      questionNumber
    };
  }
  
  return {
    isMCQ: false,
    questionText: questionText,
    options: []
  };
}

/**
 * Check if text contains multiple MCQ questions
 */
export function hasMultipleMCQs(text: string): boolean {
  const lines = text.split('\n');
  let mcqCount = 0;
  let inMCQ = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Check for question number pattern
    if (/^\d+\./.test(trimmed)) {
      if (inMCQ) mcqCount++;
      inMCQ = true;
    }
    // Check for option pattern
    if (/^\([a-z]\)\s+/.test(trimmed)) {
      if (inMCQ) {
        mcqCount++;
        inMCQ = false;
      }
    }
  }
  
  return mcqCount >= 2;
}

/**
 * Split text into multiple MCQ questions
 */
export function splitMultipleMCQs(text: string): ParsedMCQ[] {
  const questions: ParsedMCQ[] = [];
  const lines = text.split('\n');
  let currentQuestion: string[] = [];
  let currentNumber = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if this is a new question (starts with number)
    const questionMatch = trimmed.match(/^(\d+)\./);
    if (questionMatch && currentQuestion.length > 0) {
      // Parse previous question
      const parsed = parseMCQ(currentQuestion.join('\n'));
      if (parsed.isMCQ) {
        questions.push(parsed);
      }
      currentQuestion = [line];
      currentNumber = parseInt(questionMatch[1]);
    } else {
      currentQuestion.push(line);
    }
  }
  
  // Parse last question
  if (currentQuestion.length > 0) {
    const parsed = parseMCQ(currentQuestion.join('\n'));
    if (parsed.isMCQ) {
      questions.push(parsed);
    }
  }
  
  return questions;
}







