import { createClient } from "@supabase/supabase-js";
import "expo-sqlite/localStorage/install";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://aasamdcmjdqumbfiqwei.supabase.co"
const supabaseAnonKey = "sb_publishable_Jkq1uoFPLTyYE3QTOFnZGA_Qis0VEYS"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
