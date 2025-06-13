// This is a script to check if all required environment variables are set
// You can run this locally before deploying

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
  "ADMIN_PASSWORD",
  "MOD_PASSWORD",
  "GRASSROOT_PASSWORD",
  "PIONEER_PASSWORD",
  "ELDER_PASSWORD",
  "BLOOD_PASSWORD",
]

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:")
  missingVars.forEach((varName) => console.error(`   - ${varName}`))
  console.error("\nPlease add these to your Vercel project settings.")
  process.exit(1)
} else {
  console.log("✅ All required environment variables are set!")
}

// Check URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl && !supabaseUrl.startsWith("https://")) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL should start with https://")
  process.exit(1)
}

console.log("✅ Environment variables look good!")
