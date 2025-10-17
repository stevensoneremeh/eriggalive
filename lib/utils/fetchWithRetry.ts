
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        const data = await response.json();
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      // Retry on server errors (5xx) or network issues
      if (!response.ok && attempt < maxRetries) {
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}
