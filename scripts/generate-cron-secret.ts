import crypto from "crypto"

// Generate a secure CRON_SECRET
function generateCronSecret(): string {
  return crypto.randomBytes(32).toString("hex")
}

console.log("Generated CRON_SECRET:")
console.log(generateCronSecret())
console.log("\nAdd this to your environment variables:")
console.log("CRON_SECRET=<the-generated-secret-above>")
