import { cookies } from "next/headers";

export const ADMIN_AUTH_COOKIE = "admin-auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_AUTH_COOKIE)?.value === "true";
}
