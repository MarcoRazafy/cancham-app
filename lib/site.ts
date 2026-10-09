export function baseSite(): string {
  const brut = process.env.APP_URL?.trim().replace(/\/+$/, "");
  return brut || "http://localhost:3000";
}
