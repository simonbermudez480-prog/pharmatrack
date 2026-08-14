"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-btn text-sm font-semibold text-forest/80 hover:text-forest hover:bg-forest/5 transition-colors"
    >
      Cerrar sesión
    </button>
  );
}

export default LogoutButton;
