import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// ─── Endpoint Whitelist (prevents SSRF / path traversal) ────────────
const ALLOWED_ENDPOINT_PATTERN = /^gemini-[\w.-]+:(generateContent|streamGenerateContent)(\?alt=sse)?$/;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ─── 1. Verify Supabase Authentication ──────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ─── 2. Validate Gemini API Key ─────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { endpoint, body } = await req.json();

    // ─── 3. Whitelist Endpoint (prevent SSRF) ─────────────────────
    if (!endpoint || !ALLOWED_ENDPOINT_PATTERN.test(endpoint)) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hasParams = endpoint.includes('?');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}${hasParams ? '&' : '?'}key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`Gemini API error for user ${user.id}:`, errText);
      return new Response(JSON.stringify({ error: 'AI service error. Please try again.' }), {
        status: geminiRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For streaming requests
    if (endpoint.includes('streamGenerateContent')) {
      return new Response(geminiRes.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For standard JSON requests
    const json = await geminiRes.json();
    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
