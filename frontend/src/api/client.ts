/**
 * A simple wrapper around native fetch for interacting with the backend API.
 * The Vite proxy handles routing `/api/*` to the correct backend port (5000).
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = 'Network response was not ok';
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch {
      // Not JSON, use status text
      message = response.statusText || message;
    }
    throw new Error(`API Error (${response.status}): ${message}`);
  }

  // Some endpoints might return 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
