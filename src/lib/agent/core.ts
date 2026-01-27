import { ChatMessage } from '@/lib/ai';
import { tools } from './tools';
import { tryParseJSON } from '@/lib/json-utils';

type AgentResult = {
  text: string;
  tasks?: any[];
  process?: string[];
};

const SYSTEM_PROMPT = `You are an expert Project Manager AI with Agent capabilities.
Your goal is to help the user plan projects by breaking them down into actionable tasks.

TOOLS AVAILABLE:
${Object.values(tools).map(t => `- ${t.name}(args): ${t.description}`).join('\n')}

INSTRUCTIONS:
- You are encouraged to "think out loud" before using a tool.
- To use a tool, format your response as:
  THOUGHT: [Your reasoning here]
  TOOL_CALL: tool_name { "arg": "value" }
- The system will execute the tool and give you the result.
- You can loop multiple times to gather info.
- When you have the final list of tasks, YOU MUST use the 'submit_tasks' tool.
- 'submit_tasks' takes a 'tasks' argument: [{ "text": "Task Title", "subtasks": ["Subtask 1"] }]
- DO NOT print the list in the chat text. JUST call the tool.
- DO NOT print headers like "JSON Task List:" or "Here are the tasks:". Just call the tool silently.


FORMAT FOR submit_tasks:
TOOL_CALL: submit_tasks { "tasks": [ { "text": "Task Name", "subtasks": ["Subtask 1"] } ] }
`;

export async function runAgentLoop(initialMessages: ChatMessage[]): Promise<AgentResult> {
  const messages = [...initialMessages];
  const processLog: string[] = []; // Capture thoughts and actions
  
  // Inject system prompt
  let coreMessages = [...messages];
  if (coreMessages[0]?.role !== 'system') {
      coreMessages.unshift({ role: 'system', content: SYSTEM_PROMPT });
  }

  const MAX_TURNS = 5;
  let turn = 0;
  let finalTasks: any[] = [];

  while (turn < MAX_TURNS) {
    turn++;
    console.log(`[Agent] Turn ${turn}`);

    // 1. Call LLM (Text Mode)
    const responseText = await callOllama(coreMessages);
    
    // Check for THOUGHTs in the response to log them
    const thoughtMatch = responseText.match(/THOUGHT:\s*(.*)/);
    if (thoughtMatch) {
        processLog.push(`🤔 ${thoughtMatch[1].trim()}`);
    }

    // 2. Parse for Tool Call
    // Look for the "TOOL_CALL:" trigger
    const toolCallRegex = /TOOL_CALL:\s*(\w+)/;
    const toolMatch = responseText.match(toolCallRegex);
    
    if (toolMatch) {
        const toolName = toolMatch[1];
        const index = toolMatch.index!;
        
        // Extract arguments from the text following the tool name
        const textAfterTool = responseText.substring(index + toolMatch[0].length);
        const jsonInfo = extractFirstJson(textAfterTool);
        
        let args: any = {};
        let toolStringFull = toolMatch[0]; // will append json if found
        
        if (jsonInfo) {
            toolStringFull += textAfterTool.substring(0, jsonInfo.endIndex);
            args = tryParseJSON(jsonInfo.match);
        }

        console.log(`[Agent] Tool Request: ${toolName}`, args);
        processLog.push(`🛠️ Using Tool: ${toolName} ...`);
        
        // INTERCEPT submit_tasks
        if (toolName === 'submit_tasks') {
            if (args && Array.isArray(args.tasks)) {
                finalTasks = args.tasks;
                console.log(`[Agent] Tasks submitted`, finalTasks.length);
                processLog.push(`✅ Tasks Generated`);
                
                // Cleanup text: Remove the entire TOOL_CALL block using the exact extracted length
                // We also trim any leading/trailing whitespace left
                let cleanText = responseText.replace(toolStringFull, '').trim();
                
                if (!cleanText) {
                    cleanText = "I have generated the project plan tasks for you. Check the panel to the right.";
                }
                
                return { text: cleanText, tasks: finalTasks, process: processLog };
            } else {
                 processLog.push(`❌ Failed to parse tasks from submit_tasks`);
            }
        }
        
        const tool = tools[toolName];
        if (tool) {
            let result = "";
            try {
                const args = tryParseJSON(argsStr);
                result = await tool.execute(args);
                
                // Add Assistant Request + Tool Result to history
                coreMessages.push({ role: 'assistant', content: responseText });
                coreMessages.push({ role: 'system', content: `TOOL_RESULT: ${result}` });
                continue;
                
            } catch (e: any) {
                result = `Error executing tool: ${e.message}`;
                coreMessages.push({ role: 'assistant', content: responseText });
                coreMessages.push({ role: 'system', content: `TOOL_RESULT: ${result}` });
                continue;
            }
        } else {
             coreMessages.push({ role: 'assistant', content: responseText });
             coreMessages.push({ role: 'system', content: `TOOL_ERROR: Tool '${toolName}' not found.` });
             continue;
        }
    }
    
    // 3. No tool usage -> Final Answer
    // Treat the text as the answer
    // We try to parse legacy JSON block just in case, but rely on text mostly
    const result = parseFinalResponse(responseText);
    return { ...result, process: processLog };
  }

  return { text: "I reached my limit for research steps. Here is what I have so far.", tasks: finalTasks, process: processLog };
}

// Low-level Ollama call
async function callOllama(messages: ChatMessage[]): Promise<string> {
   const prompt = messages.map(m => {
       if (m.role === 'system') return `System: ${m.content}`;
       if (m.role === 'user') return `User: ${m.content}`;
       return `Assistant: ${m.content}`;
   }).join('\n\n') + "\n\nAssistant:";

   const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
   const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
   
   const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          stop: ["User:", "System:"]
      })
   });
   
   if (!res.ok) throw new Error("Ollama call failed");
   const data = await res.json();
   return data.response.trim();
}

// Helper used to be here, now imported from @/lib/json-utils

function parseFinalResponse(text: string): AgentResult {
    let tasks: any[] | undefined;
    console.log("Final Response:", text);
    // 1. Try Code Block JSON
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        console.log("Found JSON match:", jsonMatch[1]);
         const parsed = tryParseJSON(jsonMatch[1]);
         console.log("Failed to parse JSON match", parsed , Array.isArray(parsed));

         if (parsed && Array.isArray(parsed)) {
            tasks = parsed;
            text = text.replace(jsonMatch[0], '').trim();
            return { text, tasks };
         }
         
    }
    

    // 2. Try identifying a JSON array by looking for `[ {` pattern
    const arrayStartRegex = /\[\s*\{/;
    const arrayMatch = text.match(arrayStartRegex);
    
    if (arrayMatch && arrayMatch.index !== undefined) {
        const start = arrayMatch.index;
        const lastBracket = text.lastIndexOf(']');
        if (lastBracket > start) {
             const potentialJson = text.substring(start, lastBracket + 1);
             const parsed = tryParseJSON(potentialJson);
             if (parsed && Array.isArray(parsed)) {
                 tasks = parsed;
                 text = text.substring(0, start).trim();
                 return { text, tasks };
             }
        }
    }
    
    // 3. Try identifying a JSON Object `{ tasks: ... }`
    const objStartRegex = /\{\s*"?tasks"?\s*:\s*\[/;
    const objMatch = text.match(objStartRegex);
    if (objMatch && objMatch.index !== undefined) {
        const start = objMatch.index;
        const lastBrace = text.lastIndexOf('}');
         if (lastBrace > start) {
             const potentialJson = text.substring(start, lastBrace + 1);
             const parsed = tryParseJSON(potentialJson);
             if (parsed && parsed.tasks && Array.isArray(parsed.tasks)) {
                 tasks = parsed.tasks;
                 text = text.substring(0, start).trim();
                 return { text, tasks };
             }
         }
    }
    
    // 4. Fallbacks removed: We strictly require JSON or Tool Calls now to avoid bad UX.
    // If the model just bullet-points some questions, we don't want those to become "Tasks".
    
    return { text, tasks };
}
