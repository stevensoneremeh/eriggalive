import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log("🚀 Setting up Erigga Live database...")

  try {
    // Check if tables exist
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (error) {
      console.error("❌ Error checking tables:", error)
      return
    }

    const tableNames = tables?.map((t) => t.table_name) || []

    console.log("📋 Existing tables:", tableNames)

    // Check required tables
    const requiredTables = [
      "users",
      "community_categories",
      "community_posts",
      "community_comments",
      "community_post_votes",
      "community_comment_likes",
    ]

    const missingTables = requiredTables.filter((table) => !tableNames.includes(table))

    if (missingTables.length > 0) {
      console.log("⚠️  Missing tables:", missingTables)
      console.log("📝 Please run the SQL script: scripts/fix-database-schema.sql")
    } else {
      console.log("✅ All required tables exist!")
    }

    // Test basic functionality
    console.log("🧪 Testing database connection...")

    const { data: categories, error: categoriesError } = await supabase
      .from("community_categories")
      .select("*")
      .limit(1)

    if (categoriesError) {
      console.error("❌ Categories table error:", categoriesError)
    } else {
      console.log("✅ Categories table accessible")
    }

    const { data: users, error: usersError } = await supabase.from("users").select("*").limit(1)

    if (usersError) {
      console.error("❌ Users table error:", usersError)
    } else {
      console.log("✅ Users table accessible")
    }

    console.log("🎉 Database setup check complete!")
  } catch (error) {
    console.error("❌ Setup failed:", error)
  }
}

setupDatabase()
