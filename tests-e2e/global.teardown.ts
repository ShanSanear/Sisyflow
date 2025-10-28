import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL and Service Role Key must be defined in your .env.test file");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function globalTeardown() {
  console.log("Cleaning up tickets table...");
  const { error } = await supabase.from("tickets").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Dummy condition to delete all

  if (error) {
    console.error("Error cleaning up tickets table:", error);
    throw error;
  }
  console.log("Tickets table cleaned up successfully.");
}

export default globalTeardown;
