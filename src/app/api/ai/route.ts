import { NextResponse } from 'next/server';
import { runAgentLoop } from '@/lib/agent/core';

export async function POST(request: Request) {
  try {
    const { prompt, system, messages } = await request.json();

    // Support both old generic prompt and new chat history format
    const chatMessages = messages || [
        { role: 'system', content: system || "You are a helpful assistant." },
        { role: 'user', content: prompt }
    ];

    if (!chatMessages || chatMessages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Run the Agent Loop
    const result = await runAgentLoop(chatMessages);

    // Return format matches client expectation
    return NextResponse.json({ response: result.text, tasks: result.tasks, process: result.process });

  } catch (error) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
