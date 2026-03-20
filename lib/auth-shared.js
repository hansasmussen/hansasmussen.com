export function getAdminEmailSet() {
  return new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAllowedAdminEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return false;

  const adminEmails = getAdminEmailSet();
  if (!adminEmails.size) return false;

  return adminEmails.has(normalizedEmail);
}
