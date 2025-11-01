import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const adminEmail = process.env.E2E_USERNAME;
const adminPassword = process.env.E2E_PASSWORD;

if (!supabaseUrl || !supabaseAnonKey || !adminEmail || !adminPassword) {
  throw new Error("Supabase URL, SUPABASE_KEY, E2E_USERNAME, and E2E_PASSWORD must be defined in your .env.test file");
}

// Type assertion after validation
const validatedSupabaseUrl = supabaseUrl;
const validatedSupabaseAnonKey = supabaseAnonKey;
const validatedAdminEmail = adminEmail;
const validatedAdminPassword = adminPassword;

const supabase = createClient(validatedSupabaseUrl, validatedSupabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function globalTeardown() {
  console.log("Logging in as admin for cleanup...");

  // Login as admin user
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: validatedAdminEmail,
    password: validatedAdminPassword,
  });

  if (authError) {
    console.error("Error logging in as admin:", authError);
    throw authError;
  }

  console.log("Successfully logged in as admin. Cleaning up tickets table...");

  // First, check how many tickets exist before cleanup
  const { data: ticketsBefore, error: countError } = await supabase.from("tickets").select("id", { count: "exact" });

  if (countError) {
    console.error("Error counting tickets before cleanup:", countError);
  } else {
    console.log(`Found ${ticketsBefore?.length || 0} tickets before cleanup`);
  }

  // Delete all tickets
  const { error, count } = await supabase
    .from("tickets")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Dummy condition to delete all

  if (error) {
    console.error("Error cleaning up tickets table:", error);
    throw error;
  }

  console.log(`Tickets table cleaned up successfully. Deleted ${count || 0} tickets.`);

  // Logout
  await supabase.auth.signOut();
  console.log("Logged out admin user.");
}

export default globalTeardown;
