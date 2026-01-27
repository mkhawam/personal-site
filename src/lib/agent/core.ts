import { ChatMessage } from "@/lib/ai";
import { tools } from "./tools";
import { tryParseJSON } from "@/lib/json-utils";

type AgentTask = {
    text: string;
    subtasks?: string[];
};

type AgentResult = {
    text: string;
    tasks?: AgentTask[];
    process?: string[];
};

export class AIProviderError extends Error {
    status: number;
    code?: string;
    details?: Record<string, unknown>;

    constructor(message: string, options: { status: number; code?: string; details?: Record<string, unknown> }) {
        super(message);
        this.name = "AIProviderError";
        this.status = options.status;
        this.code = options.code;
        this.details = options.details;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeAgentTask(value: unknown): AgentTask | null {
    if (typeof value === "string") return { text: value };
    if (!isRecord(value)) return null;
    if (typeof value.text !== "string") return null;

    const subtasksRaw = value.subtasks;
    const subtasks =
        subtasksRaw === undefined ? undefined
        : Array.isArray(subtasksRaw) ? subtasksRaw.filter((s): s is string => typeof s === "string")
        : undefined;

    return { text: value.text, ...(subtasks ? { subtasks } : {}) };
}

const SYSTEM_PROMPT = `You are an expert Project Manager AI with Agent capabilities.
Your goal is to help the user plan projects by breaking them down into actionable tasks.

TOOLS AVAILABLE:
${Object.values(tools)
    .map((t) => `- ${t.name}(args): ${t.description}`)
    .join("\n")}

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
    const coreMessages = [...messages];
    if (coreMessages[0]?.role !== "system") {
        coreMessages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    const MAX_TURNS = 5;
    let turn = 0;
    let finalTasks: AgentTask[] = [];

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

            let args: Record<string, unknown> = {};
            let toolStringFull = toolMatch[0]; // will append json if found

            if (jsonInfo) {
                toolStringFull += textAfterTool.substring(0, jsonInfo.endIndex);
                const parsedArgs = tryParseJSON(jsonInfo.match) as unknown;
                if (isRecord(parsedArgs)) {
                    args = parsedArgs;
                }
            }

            console.log(`[Agent] Tool Request: ${toolName}`, args);
            processLog.push(`🛠️ Using Tool: ${toolName} ...`);

            // INTERCEPT submit_tasks
            if (toolName === "submit_tasks") {
                const tasksRaw = args.tasks;
                if (Array.isArray(tasksRaw)) {
                    finalTasks = tasksRaw.map(normalizeAgentTask).filter((t): t is AgentTask => t !== null);
                    console.log(`[Agent] Tasks submitted`, finalTasks.length);
                    processLog.push(`✅ Tasks Generated`);

                    // Cleanup text: Remove the entire TOOL_CALL block using the exact extracted length
                    // We also trim any leading/trailing whitespace left
                    let cleanText = responseText.replace(toolStringFull, "").trim();

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
                    result = await tool.execute(args);

                    // Add Assistant Request + Tool Result to history
                    coreMessages.push({ role: "assistant", content: responseText });
                    coreMessages.push({ role: "system", content: `TOOL_RESULT: ${result}` });
                    continue;
                } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : String(e);
                    result = `Error executing tool: ${message}`;
                    coreMessages.push({ role: "assistant", content: responseText });
                    coreMessages.push({ role: "system", content: `TOOL_RESULT: ${result}` });
                    continue;
                }
            } else {
                coreMessages.push({ role: "assistant", content: responseText });
                coreMessages.push({ role: "system", content: `TOOL_ERROR: Tool '${toolName}' not found.` });
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
    const prompt =
        messages
            .map((m) => {
                if (m.role === "system") return `System: ${m.content}`;
                if (m.role === "user") return `User: ${m.content}`;
                return `Assistant: ${m.content}`;
            })
            .join("\n\n") + "\n\nAssistant:";

    const configuredBaseUrl = process.env.OLLAMA_BASE_URL;
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    const OLLAMA_BASE_URL = configuredBaseUrl || "http://127.0.0.1:11434";
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

    if (!configuredBaseUrl && isProduction) {
        throw new AIProviderError(
            "Ollama is not configured for this deployment. Set OLLAMA_BASE_URL to a reachable Ollama server (Vercel cannot access 127.0.0.1 in your network).",
            {
                status: 503,
                code: "OLLAMA_NOT_CONFIGURED",
            },
        );
    }

    const controller = new AbortController();
    const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 15000);
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
        res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt,
                stream: false,
                stop: ["User:", "System:"],
            }),
            signal: controller.signal,
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        throw new AIProviderError(`Failed to reach Ollama at ${OLLAMA_BASE_URL}: ${message}`, {
            status: 503,
            code: "OLLAMA_UNREACHABLE",
        });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!res.ok) {
        let bodySnippet = "";
        let upstreamMessage: string | undefined;
        try {
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const rawJson = (await res.json()) as unknown;
                if (isRecord(rawJson)) {
                    const msg = rawJson.error;
                    if (typeof msg === "string" && msg.trim()) upstreamMessage = msg.trim();
                }
                bodySnippet = JSON.stringify(rawJson).slice(0, 500);
            } else {
                const raw = await res.text();
                bodySnippet = raw.slice(0, 500);
            }
        } catch {
            // ignore
        }

        const extra = upstreamMessage || bodySnippet;
        const extraPart = extra ? ` — ${extra}` : "";

        const isInsufficientMemory = typeof upstreamMessage === "string" && /requires more system memory/i.test(upstreamMessage);

        const status = isInsufficientMemory ? 503 : 502;
        const code = isInsufficientMemory ? "OLLAMA_INSUFFICIENT_MEMORY" : "OLLAMA_BAD_RESPONSE";

        const hint =
            isInsufficientMemory ? ` (Tip: set OLLAMA_MODEL to a smaller model, e.g. \"llama3.2:1b\" or another model you have installed.)` : "";

        throw new AIProviderError(`Ollama request failed with status ${res.status} ${res.statusText}${extraPart}${hint}`, {
            status,
            code,
            details: {
                upstreamStatus: res.status,
                upstreamStatusText: res.statusText,
                baseUrl: OLLAMA_BASE_URL,
                bodySnippet,
                upstreamMessage,
                model: OLLAMA_MODEL,
            },
        });
    }

    const data = (await res.json()) as unknown;
    if (!isRecord(data) || typeof data.response !== "string") {
        throw new AIProviderError("Ollama returned an unexpected response shape.", {
            status: 502,
            code: "OLLAMA_INVALID_JSON",
        });
    }

    return data.response.trim();
}

function extractFirstJson(text: string): { match: string; endIndex: number } | null {
    // Finds the first balanced JSON object/array in the string.
    // Example input: " { \"foo\": 1 } trailing" -> returns match + endIndex
    const start = text.search(/[\[{]/);
    if (start === -1) return null;

    const openChar = text[start];
    const closeChar = openChar === "{" ? "}" : "]";

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
        const ch = text[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (ch === "\\") {
                escaped = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === openChar) depth++;
        if (ch === closeChar) depth--;

        if (depth === 0) {
            const endExclusive = i + 1;
            return { match: text.substring(start, endExclusive), endIndex: endExclusive };
        }
    }

    return null;
}

// Helper used to be here, now imported from @/lib/json-utils

function parseFinalResponse(text: string): AgentResult {
    let tasks: AgentTask[] | undefined;
    console.log("Final Response:", text);
    // 1. Try Code Block JSON
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        console.log("Found JSON match:", jsonMatch[1]);
        const parsed = tryParseJSON(jsonMatch[1]) as unknown;
        console.log("Failed to parse JSON match", parsed, Array.isArray(parsed));

        if (Array.isArray(parsed)) {
            tasks = parsed.map(normalizeAgentTask).filter((t): t is AgentTask => t !== null);
            text = text.replace(jsonMatch[0], "").trim();
            return { text, tasks };
        }
    }

    // 2. Try identifying a JSON array by looking for `[ {` pattern
    const arrayStartRegex = /\[\s*\{/;
    const arrayMatch = text.match(arrayStartRegex);

    if (arrayMatch && arrayMatch.index !== undefined) {
        const start = arrayMatch.index;
        const lastBracket = text.lastIndexOf("]");
        if (lastBracket > start) {
            const potentialJson = text.substring(start, lastBracket + 1);
            const parsed = tryParseJSON(potentialJson) as unknown;
            if (Array.isArray(parsed)) {
                tasks = parsed.map(normalizeAgentTask).filter((t): t is AgentTask => t !== null);
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
        const lastBrace = text.lastIndexOf("}");
        if (lastBrace > start) {
            const potentialJson = text.substring(start, lastBrace + 1);
            const parsed = tryParseJSON(potentialJson) as unknown;
            if (isRecord(parsed) && Array.isArray(parsed.tasks)) {
                tasks = parsed.tasks.map(normalizeAgentTask).filter((t): t is AgentTask => t !== null);
                text = text.substring(0, start).trim();
                return { text, tasks };
            }
        }
    }

    // 4. Fallbacks removed: We strictly require JSON or Tool Calls now to avoid bad UX.
    // If the model just bullet-points some questions, we don't want those to become "Tasks".

    return { text, tasks };
}
