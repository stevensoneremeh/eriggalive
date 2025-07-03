// Create .env.local template
// Run with: npx tsx scripts/create-env-template.ts

import { writeFileSync } from "fs"

const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
POSTGRES_URL=your_postgres_connection_string
DATABASE_URL=your_database_url

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Paystack (Payment Processing)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# Tier Access Passwords
ADMIN_PASSWORD=your_admin_password
MOD_PASSWORD=your_mod_password
GRASSROOT_PASSWORD=your_grassroot_password
PIONEER_PASSWORD=your_pioneer_password
ELDER_PASSWORD=your_elder_password
BLOOD_PASSWORD=your_blood_password

# Optional Configuration
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_ENABLED=true
AUDIT_LOG_LEVEL=info
FILE_UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4
ENABLE_METRICS=true
LOG_LEVEL=info
ENCRYPTION_KEY=your_encryption_key
STORAGE_PROVIDER=supabase
MAINTENANCE_MODE=false
FORCE_PREVIEW_MODE=false
`

try {
  writeFileSync(".env.local.template", envTemplate)
  console.log("✅ Created .env.local.template file")
  console.log("📝 Copy this to .env.local and fill in your actual values")
  console.log("⚠️  Never commit .env.local to version control!")
} catch (error) {
  console.error("❌ Error creating template:", error)
}
