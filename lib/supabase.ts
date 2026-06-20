import { createBrowserClient } from "@supabase/ssr";

// createBrowserClient zwraca pojedynczą, współdzieloną instancję klienta.
// Dzięki temu Fast Refresh / wiele importów nie tworzy kolejnych
// instancji GoTrueClient (co powodowało zapętlone odświeżanie tokenu
// i "JavaScript heap out of memory").
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
