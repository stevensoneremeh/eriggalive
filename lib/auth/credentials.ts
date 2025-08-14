// This file contains credentials for development and testing purposes only
// In production, use environment variables or a secure credential management system

export const testUsers = {
  admin: {
    email: "admin@eriggalive.com",
    password: process.env.ADMIN_PASSWORD || "admin_password_123",
    role: "admin",
    tier: "blood_brotherhood",
  },
  moderator: {
    email: "mod@eriggalive.com",
    password: process.env.MOD_PASSWORD || "mod_password_123",
    role: "moderator",
    tier: "elder",
  },
  grassroot: {
    email: "grassroot@example.com",
    password: process.env.GRASSROOT_PASSWORD || "grassroot_123",
    role: "user",
    tier: "grassroot",
  },
  pioneer: {
    email: "pioneer@example.com",
    password: process.env.PIONEER_PASSWORD || "pioneer_123",
    role: "user",
    tier: "pioneer",
  },
  elder: {
    email: "elder@example.com",
    password: process.env.ELDER_PASSWORD || "elder_123",
    role: "user",
    tier: "elder",
  },
  blood: {
    email: "blood@example.com",
    password: process.env.BLOOD_PASSWORD || "blood_123",
    role: "user",
    tier: "blood_brotherhood",
  },
}

// Add this file to .gitignore to prevent committing credentials
// .gitignore should include: lib/auth/credentials.ts
