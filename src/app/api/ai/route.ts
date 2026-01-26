import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

export async function POST(request: Request) {
  try {
    const { prompt, system } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
    }

    // Support for extra headers (e.g. Cloudflare Access, Basic Auth)
    if (process.env.OLLAMA_EXTRA_HEADERS) {
        try {
            const extraHeaders = JSON.parse(process.env.OLLAMA_EXTRA_HEADERS);
            Object.assign(headers, extraHeaders);
        } catch (e) {
            console.warn('Failed to parse OLLAMA_EXTRA_HEADERS', e);
        }
    }

    // Specific support for Cloudflare Access (cleaner than JSON)
    if (process.env.OLLAMA_CF_CLIENT_ID && process.env.OLLAMA_CF_CLIENT_SECRET) {
        headers['CF-Access-Client-Id'] = process.env.OLLAMA_CF_CLIENT_ID;
        headers['CF-Access-Client-Secret'] = process.env.OLLAMA_CF_CLIENT_SECRET;
    }

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system, // Optional system prompt
        stream: false, // For simplicity in this v1
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama Error:', response.status, errorText);
        return NextResponse.json({ error: 'Failed to generate text', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ response: data.response });

  } catch (error) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
