import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { supabaseEnv } from "@/config/env";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  if (!supabaseEnv.serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY é obrigatório para operações administrativas.",
    );
  }

  adminClient = createClient<Database>(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
