import DOMPurify from "isomorphic-dompurify"
import validator from "validator"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: any
}

export class InputValidator {
  // User registration validation
  user(userData: {
    email: string
    password: string
    username: string
    fullName: string
  }): ValidationResult {
    const errors: string[] = []
    const sanitizedData: any = {}

    // Email validation
    if (!userData.email || !validator.isEmail(userData.email)) {
      errors.push("Valid email address is required")
    } else {
      sanitizedData.email = validator.normalizeEmail(userData.email) || userData.email
    }

    // Password validation
    if (!userData.password) {
      errors.push("Password is required")
    } else if (userData.password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(userData.password)) {
      errors.push(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      )
    }

    // Username validation
    if (!userData.username) {
      errors.push("Username is required")
    } else if (userData.username.length < 3 || userData.username.length > 30) {
      errors.push("Username must be between 3 and 30 characters")
    } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      errors.push("Username can only contain letters, numbers, and underscores")
    } else {
      sanitizedData.username = validator.escape(userData.username.toLowerCase())
    }

    // Full name validation
    if (!userData.fullName) {
      errors.push("Full name is required")
    } else if (userData.fullName.length < 2 || userData.fullName.length > 100) {
      errors.push("Full name must be between 2 and 100 characters")
    } else {
      sanitizedData.fullName = DOMPurify.sanitize(userData.fullName.trim())
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    }
  }

  // Login credentials validation
  credentials(credentials: {
    email: string
    password: string
  }): ValidationResult {
    const errors: string[] = []

    if (!credentials.email || !validator.isEmail(credentials.email)) {
      errors.push("Valid email address is required")
    }

    if (!credentials.password || credentials.password.length < 1) {
      errors.push("Password is required")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Post content validation
  postContent(content: {
    title?: string
    content: string
    mediaUrls?: string[]
    hashtags?: string[]
  }): ValidationResult {
    const errors: string[] = []
    const sanitizedData: any = {}

    // Title validation (optional)
    if (content.title) {
      if (content.title.length > 200) {
        errors.push("Title must be less than 200 characters")
      } else {
        sanitizedData.title = DOMPurify.sanitize(content.title.trim())
      }
    }

    // Content validation
    if (!content.content) {
      errors.push("Content is required")
    } else if (content.content.length > 5000) {
      errors.push("Content must be less than 5000 characters")
    } else {
      sanitizedData.content = DOMPurify.sanitize(content.content.trim())
    }

    // Media URLs validation
    if (content.mediaUrls && content.mediaUrls.length > 0) {
      const validUrls: string[] = []
      for (const url of content.mediaUrls) {
        if (validator.isURL(url, { protocols: ["http", "https"] })) {
          validUrls.push(url)
        } else {
          errors.push(`Invalid media URL: ${url}`)
        }
      }
      sanitizedData.mediaUrls = validUrls
    }

    // Hashtags validation
    if (content.hashtags && content.hashtags.length > 0) {
      const validHashtags: string[] = []
      for (const hashtag of content.hashtags) {
        if (/^[a-zA-Z0-9_]+$/.test(hashtag) && hashtag.length <= 50) {
          validHashtags.push(hashtag.toLowerCase())
        } else {
          errors.push(`Invalid hashtag: ${hashtag}`)
        }
      }
      sanitizedData.hashtags = validHashtags
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    }
  }

  // File upload validation
  fileUpload(file: {
    name: string
    size: number
    type: string
    buffer?: Buffer
  }): ValidationResult {
    const errors: string[] = []
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "video/mp4",
      "video/webm",
      "video/ogg",
    ]

    // File name validation
    if (!file.name || file.name.length > 255) {
      errors.push("Invalid file name")
    }

    // File size validation
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
    }

    // File type validation
    if (!allowedTypes.includes(file.type)) {
      errors.push("File type not allowed")
    }

    // Additional security checks for file content
    if (file.buffer) {
      // Check for malicious file signatures
      const fileSignature = file.buffer.slice(0, 4).toString("hex")
      const maliciousSignatures = ["4d5a9000", "504b0304"] // PE executable, ZIP

      if (maliciousSignatures.includes(fileSignature)) {
        errors.push("File contains potentially malicious content")
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // SQL injection prevention
  sanitizeForDatabase(input: string): string {
    return validator.escape(input)
  }

  // XSS prevention
  sanitizeForDisplay(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
      ALLOWED_ATTR: ["href"],
    })
  }
}

export const validateInput = new InputValidator()
