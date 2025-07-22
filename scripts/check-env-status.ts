// Environment Variables Checker
// Run with: npx tsx scripts/check-env-status.ts

const requiredEnvVars = [
  // Supabase
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",

  // Database
  "POSTGRES_URL",
  "DATABASE_URL",

  // Authentication
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "REFRESH_TOKEN_EXPIRES_IN",

  // Paystack (if using payments)
  "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_SECRET_KEY",

  // App Configuration
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",

  // Tier Passwords
  "ADMIN_PASSWORD",
  "MOD_PASSWORD",
  "GRASSROOT_PASSWORD",
  "PIONEER_PASSWORD",
  "ELDER_PASSWORD",
  "BLOOD_PASSWORD",
]

const optionalEnvVars = [
  "CORS_ORIGINS",
  "RATE_LIMIT_ENABLED",
  "AUDIT_LOG_LEVEL",
  "FILE_UPLOAD_MAX_SIZE",
  "ALLOWED_FILE_TYPES",
  "ENABLE_METRICS",
  "LOG_LEVEL",
  "ENCRYPTION_KEY",
  "STORAGE_PROVIDER",
  "MAINTENANCE_MODE",
  "FORCE_PREVIEW_MODE",
]

function checkEnvironmentVariables() {
  console.log("🔍 Checking Environment Variables...\n")

  let missingRequired = 0
  let missingOptional = 0

  console.log("📋 REQUIRED VARIABLES:")
  console.log("=".repeat(50))

  requiredEnvVars.forEach((varName) => {
    const value = process.env[varName]
    const status = value ? "✅ SET" : "❌ MISSING"
    const preview = value ? `(${value.substring(0, 8)}...)` : ""

    console.log(`${status} ${varName} ${preview}`)

    if (!value) {
      missingRequired++
    }
  })

  console.log("\n📋 OPTIONAL VARIABLES:")
  console.log("=".repeat(50))

  optionalEnvVars.forEach((varName) => {
    const value = process.env[varName]
    const status = value ? "✅ SET" : "⚠️  NOT SET"
    const preview = value ? `(${value.substring(0, 8)}...)` : ""

    console.log(`${status} ${varName} ${preview}`)

    if (!value) {
      missingOptional++
    }
  })

  console.log("\n📊 SUMMARY:")
  console.log("=".repeat(50))
  console.log(`Required variables: ${requiredEnvVars.length - missingRequired}/${requiredEnvVars.length} set`)
  console.log(`Optional variables: ${optionalEnvVars.length - missingOptional}/${optionalEnvVars.length} set`)

  if (missingRequired > 0) {
    console.log(`\n❌ ${missingRequired} required environment variables are missing!`)
    console.log("Your app may not work correctly.")
  } else {
    console.log("\n✅ All required environment variables are set!")
  }

  return missingRequired === 0
}

// Run the check
checkEnvironmentVariables()
