import { createClient, type User } from '@supabase/supabase-js';
import { isAdminEmail } from '../admin';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://qkapwhyxcpgzahuemucg.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrYXB3aHl4Y3BnemFodWVtdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTgzNTUsImV4cCI6MjA2NTEzNDM1NX0.Labu2GwodnfEce4Nh5oBqTBTaD3weN63nKRMwAsyfbg';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function getServiceClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY on server');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

export function getAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function requireAdminFromBearerToken(token: string): Promise<User> {
  const anon = getAnonClient();
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) throw new Error('Unauthorized');
  if (!isAdminEmail(data.user.email)) throw new Error('Forbidden');
  return data.user;
}

export function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}



