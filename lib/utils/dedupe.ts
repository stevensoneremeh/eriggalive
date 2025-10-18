
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
