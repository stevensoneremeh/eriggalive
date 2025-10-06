
type PendingRequest = {
  key: string
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest>()
const REQUEST_TIMEOUT = 1000 // 1 second

export function shouldAllowRequest(key: string): boolean {
  const now = Date.now()
  const existing = pendingRequests.get(key)
  
  if (existing && now - existing.timestamp < REQUEST_TIMEOUT) {
    return false
  }
  
  pendingRequests.set(key, { key, timestamp: now })
  
  // Cleanup old entries
  for (const [k, v] of pendingRequests.entries()) {
    if (now - v.timestamp > REQUEST_TIMEOUT) {
      pendingRequests.delete(k)
    }
  }
  
  return true
}
