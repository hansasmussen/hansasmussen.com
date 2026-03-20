import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "@/lib/auth-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email || !isAllowedAdminEmail(user.email)) {
    return null;
  }

  return user;
}

export async function requireAdminUser(nextPath = "/admin") {
  const user = await getAuthenticatedAdminUser();

  if (!user) {
    const destination = `/login?next=${encodeURIComponent(nextPath)}`;
    redirect(destination);
  }

  return user;
}

export async function assertAdminRequest() {
  const user = await getAuthenticatedAdminUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
