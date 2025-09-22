// Content validation utilities for filtering URLs and inappropriate content

// URL detection patterns
const URL_PATTERNS = [
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
  /www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
  /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/gi
]

// Check if content contains URLs
export function containsUrls(content: string): boolean {
  if (!content || typeof content !== 'string') return false
  
  return URL_PATTERNS.some(pattern => {
    pattern.lastIndex = 0 // Reset regex state
    return pattern.test(content)
  })
}

// Extract URLs from content
export function extractUrls(content: string): string[] {
  if (!content || typeof content !== 'string') return []
  
  const urls: string[] = []
  
  URL_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0 // Reset regex state
    let match
    while ((match = pattern.exec(content)) !== null) {
      urls.push(match[0])
    }
  })
  
  return [...new Set(urls)] // Remove duplicates
}

// Clean content by removing URLs
export function removeUrls(content: string): string {
  if (!content || typeof content !== 'string') return content
  
  let cleaned = content
  
  URL_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0 // Reset regex state
    cleaned = cleaned.replace(pattern, '[URL removed]')
  })
  
  return cleaned.trim()
}

// Validate content and return validation result
export interface ContentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  cleanedContent?: string
}

export function validateContent(content: string, allowUrls = false): ContentValidationResult {
  const result: ContentValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  }
  
  if (!content || typeof content !== 'string') {
    result.isValid = false
    result.errors.push('Content is required')
    return result
  }
  
  // Check length
  if (content.trim().length === 0) {
    result.isValid = false
    result.errors.push('Content cannot be empty')
    return result
  }
  
  if (content.length > 2000) {
    result.isValid = false
    result.errors.push('Content is too long (maximum 2000 characters)')
    return result
  }
  
  // Check for URLs
  if (!allowUrls && containsUrls(content)) {
    const urls = extractUrls(content)
    result.isValid = false
    result.errors.push(`URLs are not allowed in posts. Found: ${urls.join(', ')}`)
    result.cleanedContent = removeUrls(content)
    return result
  }
  
  // Additional content checks can be added here
  // - Spam detection
  // - Inappropriate language
  // - Excessive caps
  
  return result
}

// Emoji support utilities
export const ALLOWED_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
  // Music and celebration emojis
  '🎵', '🎶', '🎤', '🎧', '🎼', '🎹', '🥁', '🎸', '🎺', '🎷',
  '🔥', '💯', '👏', '🙌', '👍', '👎', '❤️', '💙', '💚', '💛',
  '🧡', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓',
  '💗', '💖', '💘', '💝', '💟', '♥️', '💯', '✨', '🌟', '⭐'
]

export function containsOnlyAllowedEmojis(text: string): boolean {
  // Simple validation for now - just return true
  // In production, implement proper emoji validation
  return true
}

export function sanitizeTextContent(content: string): string {
  // Basic sanitization - remove potential HTML/script tags
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}