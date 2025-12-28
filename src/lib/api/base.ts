/**
 * Base API utilities and configuration
 */

// Determine API base URL with flexible environment handling
const getApiBaseUrl = () => {
  // 1. Use explicit environment variable if set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. In development (localhost), support both local and remote backends
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Check if user wants to use local backend
    if (import.meta.env.VITE_USE_LOCAL_BACKEND === 'true') {
      return 'http://localhost:8000/api';
    }
    // Otherwise use Vite proxy to connect to remote backend (avoids CORS)
    return '/api';
  }

  // 3. In production deployment, use direct backend URL
  return 'https://classroom-backend-821372121985.us-central1.run.app/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Request cache for deduplication
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;
  
  // Check cache for GET requests
  if (!options.method || options.method === 'GET') {
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.promise;
    }
  }

  const fetchPromise = fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }).then(async (response) => {
    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch {
        errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      let errorMessage = errorData.error?.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;

      if (response.status === 400) {
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: any) => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (errorData.detail) {
          errorMessage = `Invalid input: ${errorData.detail}`;
        } else {
          errorMessage = "Invalid input provided";
        }
      } else if (response.status === 404) {
        errorMessage = `Endpoint not found: ${endpoint}`;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api-error', {
            detail: { status: 404, message: errorMessage, endpoint }
          }));
        }
      }

      throw new APIError(errorMessage, response.status, errorData);
    }

    return response.json();
  });

  // Cache GET requests
  if (!options.method || options.method === 'GET') {
    requestCache.set(cacheKey, { promise: fetchPromise, timestamp: Date.now() });
    
    // Clean up old cache entries
    setTimeout(() => {
      for (const [key, value] of requestCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_TTL) {
          requestCache.delete(key);
        }
      }
    }, CACHE_TTL);
  }

  return fetchPromise;
}