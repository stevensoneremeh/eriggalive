
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function dedupe<T extends (...args: any[]) => Promise<any>>(
  func: T
): T {
  const pending = new Map<string, Promise<any>>();

  return (async (...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (pending.has(key)) {
      return pending.get(key);
    }

    const promise = func(...args).finally(() => {
      pending.delete(key);
    });

    pending.set(key, promise);
    return promise;
  }) as T;
}
