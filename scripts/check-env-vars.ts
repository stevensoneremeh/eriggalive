// This is a script to check if all required environment variables are set
// You can run this locally before deploying

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
]

const optionalEnvVars = ["CLERK_WEBHOOK_SECRET", "SUPABASE_JWT_SECRET"]

const missingRequired = requiredEnvVars.filter((varName) => !process.env[varName])
const missingOptional = optionalEnvVars.filter((varName) => !process.env[varName])

if (missingRequired.length > 0) {
  console.error("❌ Missing required environment variables:")
  missingRequired.forEach((varName) => console.error(`   - ${varName}`))
  console.error("\nPlease add these to your Vercel project settings.")
  process.exit(1)
} else {
  console.log("✅ All required environment variables are set!")
}

if (missingOptional.length > 0) {
  console.warn("⚠️  Missing optional environment variables:")
  missingOptional.forEach((varName) => console.warn(`   - ${varName}`))
  console.warn("\nThese are optional but may be needed for full functionality.")
}

// Check URL formats
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl && !supabaseUrl.startsWith("https://")) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL should start with https://")
  process.exit(1)
}

if (supabaseUrl && !supabaseUrl.includes(".supabase.")) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL doesn't appear to be a valid Supabase URL")
  process.exit(1)
}

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
if (clerkPublishableKey && !clerkPublishableKey.startsWith("pk_")) {
  console.error("❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY should start with pk_")
  process.exit(1)
}

const clerkSecretKey = process.env.CLERK_SECRET_KEY
if (clerkSecretKey && !clerkSecretKey.startsWith("sk_")) {
  console.error("❌ CLERK_SECRET_KEY should start with sk_")
  process.exit(1)
}

console.log("✅ Environment variables look good!")
console.log(`✅ Supabase URL: ${supabaseUrl}`)
console.log(`✅ Clerk integration configured`)
