const https = require("https")

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.com"

async function checkHealth() {
  console.log("🔍 Running production health checks...")

  const checks = [
    { name: "Application Health", url: `${APP_URL}/api/health` },
    { name: "Database Health", url: `${APP_URL}/api/health/database` },
    { name: "Authentication", url: `${APP_URL}/api/auth/validate` },
    { name: "Payment System", url: `${APP_URL}/api/health/payments` },
  ]

  const results = []

  for (const check of checks) {
    try {
      const result = await makeRequest(check.url)
      results.push({
        name: check.name,
        status: result.status < 400 ? "PASS" : "FAIL",
        responseTime: result.responseTime,
        statusCode: result.status,
      })
    } catch (error) {
      results.push({
        name: check.name,
        status: "FAIL",
        error: error.message,
      })
    }
  }

  console.log("\n📊 Health Check Results:")
  console.log("========================")

  results.forEach((result) => {
    const status = result.status === "PASS" ? "✅" : "❌"
    console.log(`${status} ${result.name}: ${result.status}`)
    if (result.responseTime) {
      console.log(`   Response Time: ${result.responseTime}ms`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  const failedChecks = results.filter((r) => r.status === "FAIL")

  if (failedChecks.length === 0) {
    console.log("\n🎉 All health checks passed!")
    process.exit(0)
  } else {
    console.log(`\n⚠️  ${failedChecks.length} health check(s) failed!`)
    process.exit(1)
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const req = https.get(url, (res) => {
      const responseTime = Date.now() - start
      resolve({
        status: res.statusCode,
        responseTime,
      })
    })

    req.on("error", reject)
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error("Request timeout"))
    })
  })
}

checkHealth()
