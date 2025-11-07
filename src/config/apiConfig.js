/**
 * API Configuration for Discord App
 * Automatically detects environment and sets appropriate API base URL
 * Supports both local development and cloud deployment
 */

/**
 * Get the API base URL based on environment
 * Priority:
 * 1. VITE_API_URL environment variable (explicit)
 * 2. Auto-detect from frontend URL (production)
 * 3. Default to localhost (development)
 */
export function getApiBaseUrl() {
  // 1. Check for explicit environment variable (highest priority)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    console.log('[Discord API Config] Using VITE_API_URL:', envApiUrl);
    return envApiUrl;
  }

  // 2. Auto-detect production backend URL from frontend URL
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  
  // Check if we're in production (cloud deployment)
  const isProduction = currentHost.includes('.run.app') || 
                       currentHost.includes('.appspot.com') ||
                       currentHost.includes('.netlify.app') ||
                       currentHost.includes('.vercel.app') ||
                       (!currentHost.includes('localhost') && !currentHost.includes('127.0.0.1'));

  if (isProduction) {
    // For Sahay deployment, backend is typically at a similar URL
    // Try common patterns:
    const backendHostname = currentHost.replace('discord', 'backend')
                                       .replace('sahay-discord', 'sahay-backend')
                                       .replace('google-hackathon-discord', 'google-hackathon-backend');
    
    // If hostname changed, use the new backend URL
    if (backendHostname !== currentHost) {
      const backendUrl = `${currentProtocol}//${backendHostname}`;
      console.log('[Discord API Config] Auto-detected production backend:', backendUrl);
      return backendUrl;
    }
    
    // Fallback: try to construct from known patterns
    // If frontend is at sahay-discord-xxx-uc.a.run.app
    // Backend might be at sahay-backend-xxx-uc.a.run.app
    const hostParts = currentHost.split('-');
    if (hostParts.length >= 3 && hostParts[0] === 'sahay') {
      hostParts[1] = 'backend';
      const backendHost = hostParts.join('-');
      const backendUrl = `${currentProtocol}//${backendHost}`;
      console.log('[Discord API Config] Constructed production backend URL:', backendUrl);
      return backendUrl;
    }
    
    // Last resort: use same host but different path (if backend is on same domain)
    console.warn('[Discord API Config] Could not auto-detect backend URL. Using same host. Please set VITE_API_URL.');
    return `${currentProtocol}//${currentHost}`;
  }

  // 3. Development: use localhost
  const localApiUrl = 'http://localhost:8000';
  console.log('[Discord API Config] Using local development backend:', localApiUrl);
  return localApiUrl;
}

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

// Also export WebSocket URL getter
export function getWebSocketUrl(path = '') {
  // Check for explicit WebSocket URL environment variable
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl) {
    console.log('[Discord API Config] Using VITE_WS_URL:', envWsUrl);
    return envWsUrl + path;
  }
  
  // Otherwise, generate from API base URL
  const apiUrl = API_BASE_URL;
  
  // Convert HTTP(S) URL to WebSocket URL
  if (apiUrl.startsWith('https://')) {
    return apiUrl.replace('https://', 'wss://') + path;
  } else if (apiUrl.startsWith('http://')) {
    return apiUrl.replace('http://', 'ws://') + path;
  }
  
  // Fallback for local development
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:8000${path}`;
}

// Log the configuration
console.log('[Discord API Config] API Base URL:', API_BASE_URL);
console.log('[Discord API Config] Environment:', import.meta.env.MODE);
console.log('[Discord API Config] Current host:', window.location.hostname);

