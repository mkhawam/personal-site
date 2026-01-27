
type Task = {
    id: string;
    text: string;
    completed: boolean;
    subtasks?: any[];
};

import { tryParseJSON } from './json-utils';

// Types for Chat
export type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export type ChatResponse = {
    text: string;
    tasks?: { text: string, subtasks?: string[] }[];
    process?: string[];
};

export async function chatWithAI(messages: ChatMessage[]): Promise<ChatResponse> {
    const prompt = `You are an expert Project Manager AI. I am brainstorming a project or goal.
Your job is to help me break it down into actionable tasks.

RULES:
1. Actively ask clarifying questions if the goal is vague (e.g., specific requirements, deadlines, constraints).
2. Offer advice or strategy if appropriate.
3. WHEN you are ready to suggest tasks, provide them as a valid JSON array of objects at the VERY END of your response.
4. Format the JSON block like this:
   \`\`\`json
   [
     { "text": "Main Task 1", "subtasks": ["Subtask A", "Subtask B"] },
     { "text": "Main Task 2", "subtasks": [] }
   ]
   \`\`\`

Current Conversation History:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Respond naturally as the assistant.`;

    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) throw new Error('Failed to chat');

        const data = await response.json();
        const rawText = data.response;
        console.log("Client received AI response:", data);

        // Parse mixed response (Text + Optional JSON)
        let text = rawText;
        let tasks: { text: string, subtasks?: string[] }[] | undefined = data.tasks;

        // If server returned tasks, we don't need to parse rawText usually.
        // But if tasks is missing, try client-side fallback.
        if (!tasks || tasks.length === 0) {
            // Try to find JSON block
            const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
        
        if (jsonMatch) {
            try {
                const jsonContent = jsonMatch[1];
                const parsed = tryParseJSON(jsonContent);
                
                if (Array.isArray(parsed)) {
                    tasks = parsed.map((t: any) => ({
                        text: typeof t === 'string' ? t : t.text,
                        subtasks: Array.isArray(t.subtasks) ? t.subtasks : []
                    }));
                    // Remove the JSON block from the display text to avoid clutter
                    text = rawText.replace(jsonMatch[0], '').trim();
                }
            } catch (e) {
                console.warn('Failed to parse potential JSON task list', e);
            }
        } else {
             // Fallback: If no code block, but ends with a bracket structure, try to parse the end
             const lastBracket = rawText.lastIndexOf('[');
             const lastClose = rawText.lastIndexOf(']');
             if (lastBracket > -1 && lastClose > lastBracket) {
                 try {
                     const potentialJson = rawText.substring(lastBracket, lastClose + 1);
                     const parsed = JSON.parse(potentialJson);
                     if (Array.isArray(parsed)) {
                        tasks = parsed.map((t: any) => ({
                            text: typeof t === 'string' ? t : t.text,
                            subtasks: Array.isArray(t.subtasks) ? t.subtasks : []
                        }));
                        text = rawText.substring(0, lastBracket).trim();
                     }
                 } catch (e) {}
             }
        }

        }
        
        let finalText = text;
        if (data.process && Array.isArray(data.process) && data.process.length > 0) {
            // Prepend process as a blockquote or similar
            const processBlock = data.process.map((p: string) => `> ${p}`).join('\n');
            finalText = `${processBlock}\n\n${text}`;
        }
        
        return { text: finalText, tasks };

    } catch (error) {
        console.error('AI Chat Error:', error);
        throw error;
    }
}

export async function generateSummary(completedTasks: Task[], focusMinutes: number): Promise<string> {
    const taskList = completedTasks.map(t => `- ${t.text}`).join('\n');
    
    const prompt = `You are a supportive and encouraging productivity assistant. 
Summarize my day based on the work I've done today.
I have focused for ${focusMinutes} minutes.
Here are the tasks I completed:
${taskList}

Write a brief, motivating summary (2-3 sentences) in the second person ("You"). valid markdown is supported.`;

    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) throw new Error('Failed to generate summary');

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('AI Summary Error:', error);
        throw error;
    }
}
