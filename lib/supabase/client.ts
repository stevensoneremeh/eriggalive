// Re-export from our new utility file
import { createClient, supabaseClient } from "../supabase-utils"

export { createClient }
export default supabaseClient
