/**
 * Gemini API utility with error handling and fallbacks
 * Updated to use the new Google GenAI library
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

interface GeminiApiOptions {
  prompt: string;
  imageData?: string; // Base64 encoded image
  maxRetries?: number;
  timeout?: number;
}

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public status?: string
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

export const callGeminiApi = async (options: GeminiApiOptions): Promise<string> => {
  const { prompt, imageData, maxRetries = 2, timeout = 30000 } = options;
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_ACTUAL_GEMINI_API_KEY_HERE' || apiKey === 'YOUR_ACTUAL_API_KEY_HERE') {
    throw new GeminiApiError(
      'Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.',
      401,
      'UNAUTHORIZED'
    );
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Initialize Google Generative AI
      const genAI = new GoogleGenerativeAI(apiKey);

      // Get the generative model - using stable model name
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Prepare content based on whether we have image data
      let content: any;
      
      if (imageData) {
        // For image analysis - ensure proper format
        content = [
          prompt,
          {
            inlineData: {
              data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''), // Remove data URL prefix if present
              mimeType: "image/jpeg"
            }
          }
        ];
      } else {
        // For text-only - simple string format
        content = prompt;
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      // Generate content with timeout
      const responsePromise = model.generateContent(content);

      const result = await Promise.race([responsePromise, timeoutPromise]);
      const response = result.response;
      const text = response.text();
      
      if (!text) {
        throw new GeminiApiError(
          'No response generated from Gemini API',
          500,
          'NO_RESPONSE'
        );
      }

      return text;

    } catch (error) {
      lastError = error as Error;
      
      // Handle specific error types
      if (error instanceof Error) {
        console.error('Gemini API Error Details:', {
          message: error.message,
          stack: error.stack,
          attempt: attempt + 1
        });
        
        if (error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
          throw new GeminiApiError(
            'API key is invalid or has insufficient permissions. Please check your Gemini API key.',
            403,
            'FORBIDDEN'
          );
        } else if (error.message.includes('429') || error.message.includes('RATE_LIMIT_EXCEEDED')) {
          throw new GeminiApiError(
            'Rate limit exceeded. Please try again later.',
            429,
            'RATE_LIMITED'
          );
        } else if (error.message.includes('400') || error.message.includes('INVALID_ARGUMENT')) {
          throw new GeminiApiError(
            `Invalid request format: ${error.message}. Please check your input parameters.`,
            400,
            'BAD_REQUEST'
          );
        } else if (error.message.includes('404') || error.message.includes('NOT_FOUND')) {
          throw new GeminiApiError(
            'Model not found. Please check the model name (gemini-2.5-flash).',
            404,
            'NOT_FOUND'
          );
        } else if (error.message.includes('timeout')) {
          throw new GeminiApiError(
            'Request timeout. Please try again.',
            408,
            'TIMEOUT'
          );
        } else if (error.message.includes('SAFETY')) {
          throw new GeminiApiError(
            'Content was blocked by safety filters. Please modify your input.',
            400,
            'SAFETY_BLOCKED'
          );
        }
      }
      
      // Don't retry on certain errors
      if (error instanceof GeminiApiError) {
        if ([401, 403, 400].includes(error.code || 0)) {
          throw error;
        }
      }
      
      // If this is the last attempt, break
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  throw lastError || new GeminiApiError('All retry attempts failed', 500, 'RETRY_FAILED');
};

export const analyzeImage = async (imageData: string, prompt: string): Promise<string> => {
  try {
    return await callGeminiApi({
      prompt,
      imageData,
      maxRetries: 2,
      timeout: 30000
    });
  } catch (error) {
    if (error instanceof GeminiApiError) {
      // Provide user-friendly error messages
      switch (error.code) {
        case 403:
          return "I'm having trouble accessing the AI service. Please check your API configuration.";
        case 429:
          return "The AI service is currently busy. Please try again in a moment.";
        case 401:
          return "AI service authentication failed. Please check your API key configuration.";
        default:
          return `AI analysis temporarily unavailable: ${error.message}`;
      }
    }
    
    return "I'm unable to analyze the image right now. Please try again later.";
  }
};

export const generateText = async (prompt: string): Promise<string> => {
  try {
    return await callGeminiApi({
      prompt,
      maxRetries: 2,
      timeout: 20000
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    if (error instanceof GeminiApiError) {
      // Provide user-friendly error messages
      switch (error.code) {
        case 403:
          return "I'm having trouble accessing the AI service. Please check your API configuration.";
        case 429:
          return "The AI service is currently busy. Please try again in a moment.";
        case 401:
          return "AI service authentication failed. Please check your API key configuration.";
        case 400:
          if (error.status === 'SAFETY_BLOCKED') {
            return "I cannot provide a response to this content due to safety guidelines. Please try rephrasing your question.";
          }
          return "There was an issue with your request format. Please try rephrasing your question.";
        default:
          return `AI response temporarily unavailable: ${error.message}`;
      }
    }
    
    // Handle generic errors
    const errorMessage = (error as Error).message || 'Unknown error';
    if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
      return "I cannot provide a response to this content due to safety guidelines. Please try rephrasing your question.";
    }
    
    return "I'm unable to generate a response right now. Please try again later.";
  }
};

// Validate API key format
export const validateApiKey = (apiKey: string): { valid: boolean; message: string } => {
  if (!apiKey) {
    return { valid: false, message: 'API key is required' };
  }
  
  if (apiKey === 'YOUR_ACTUAL_API_KEY_HERE' || apiKey === 'YOUR_ACTUAL_GEMINI_API_KEY_HERE') {
    return { valid: false, message: 'Please replace the placeholder with your actual API key' };
  }
  
  if (apiKey.length < 20) {
    return { valid: false, message: 'API key appears to be too short' };
  }
  
  if (!apiKey.startsWith('AIza')) {
    return { valid: false, message: 'Gemini API keys typically start with "AIza"' };
  }
  
  return { valid: true, message: 'API key format looks correct' };
};

// Test function to validate API key
export const testGeminiConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Validate API key format first
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      return {
        success: false,
        message: `API Key Validation Failed: ${validation.message}`
      };
    }
    
    const response = await callGeminiApi({
      prompt: "Say 'Hello' if you can hear me.",
      maxRetries: 1,
      timeout: 10000
    });
    
    return {
      success: true,
      message: `Connection successful: ${response}`
    };
  } catch (error) {
    if (error instanceof GeminiApiError) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
    
    return {
      success: false,
      message: `Connection failed: ${(error as Error).message}`
    };
  }
};