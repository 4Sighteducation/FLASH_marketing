export const ADMIN_EMAILS = [
  'tony@vespa.academy',
  'admin@vespa.academy',
  'tonyden10@gmail.com',
  'tony@fl4shcards.com',
].map((e) => e.toLowerCase());

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}


