import { createClient } from 'npm:@supabase/supabase-js@2';

const projectUrl = Deno.env.get('SUPABASE_URL') ?? '';

function defaultKey(variable: string): string {
  const raw = Deno.env.get(variable);
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? '';
  } catch {
    return raw;
  }
}

const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') || defaultKey('SUPABASE_PUBLISHABLE_KEYS');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || defaultKey('SUPABASE_SECRET_KEYS');

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function createServiceClient() {
  if (!projectUrl || !serviceKey) throw new Error('Supabase service credentials are unavailable.');
  return createClient(projectUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function authenticateAdmin(request: Request): Promise<boolean> {
  const authorization = request.headers.get('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!projectUrl || !publishableKey || !token) return false;

  const userClient = createClient(projectUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await userClient.auth.getUser(token);
  return !error && data.user?.aud === 'authenticated';
}

export function getProjectUrl(): string {
  return projectUrl.replace(/\/+$/, '');
}
