export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4
  hint: string
  feedback?: string
}

const COMMON_PASSWORDS = new Set([
  "password",
  "123456",
  "123456789",
  "qwerty",
  "111111",
  "abc123",
  "letmein",
  "123123",
  "12345678",
  "iloveyou",
  "admin",
  "welcome",
  "monkey",
  "dragon",
])

const sequentialPatterns = [
  "0123456789",
  "abcdefghijklmnopqrstuvwxyz",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
]

export function validateEmail(email: string) {
  // RFC 5322 simplified
  const re =
    // eslint-disable-next-line no-control-regex
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email.toLowerCase())
}

function hasSequential(password: string): boolean {
  const p = password.toLowerCase()
  return sequentialPatterns.some((pat) => {
    for (let i = 0; i < pat.length - 2; i++) {
      const seq = pat.slice(i, i + 3)
      if (p.includes(seq)) return true
    }
    return false
  })
}

function hasRepeating(password: string): boolean {
  return /(.)\1{2,}/.test(password) // triple repeats
}

function charVariety(password: string) {
  const lower = /[a-z]/.test(password)
  const upper = /[A-Z]/.test(password)
  const digit = /[0-9]/.test(password)
  const special = /[^A-Za-z0-9]/.test(password)
  const classes = [lower, upper, digit, special].filter(Boolean).length
  return classes
}

export function getPasswordStrength(password: string, email?: string): PasswordStrength {
  if (!password) {
    return { score: 0, hint: "Use at least 6 characters with a mix of letters, numbers, and symbols." }
  }

  const pwd = password.trim()
  const lowerPwd = pwd.toLowerCase()
  const emailLocal = (email || "").split("@")[0]?.toLowerCase()

  let score: 0 | 1 | 2 | 3 | 4 = 0
  let feedback: string | undefined

  if (pwd.length >= 6) score = 1
  if (pwd.length >= 8) score = 2
  if (pwd.length >= 10) score = 3
  if (pwd.length >= 12) score = 4

  // Penalize common passwords
  if (COMMON_PASSWORDS.has(lowerPwd)) {
    score = 1
    feedback = "Avoid common passwords like 'password' or '123456'."
  }

  // Penalize if contains email local part
  if (emailLocal && lowerPwd.includes(emailLocal) && emailLocal.length >= 3) {
    score = (score > 1 ? (score - 1) as any : 1)
    feedback = "Don’t include your email name in the password."
  }

  // Penalize sequential and repeating patterns
  if (hasSequential(pwd)) {
    score = (score > 1 ? (score - 1) as any : 1)
    feedback = "Avoid sequential patterns like 'abc' or '123'."
  }
  if (hasRepeating(pwd)) {
    score = (score > 1 ? (score - 1) as any : 1)
    feedback = "Avoid repeating the same character multiple times."
  }

  // Reward character variety
  const variety = charVariety(pwd)
  if (variety >= 3 && score < 4) score = (score + 1 > 4 ? 4 : (score + 1)) as any

  const hint =
    score >= 4
      ? "Strong password."
      : score === 3
        ? "Good password. Consider adding more variety or length."
        : score === 2
          ? "Fair password. Add more length and character variety."
          : "Use at least 6 characters with a mix of letters, numbers, and symbols."

  return { score, hint, feedback }
}

export function isStrongEnough(s: PasswordStrength) {
  // Require minimum score 3 with 6+ chars
  return s.score >= 3
}
