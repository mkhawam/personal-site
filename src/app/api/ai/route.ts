import { NextResponse } from "next/server";
import { AIProviderError, runAgentLoop } from "@/lib/agent/core";
import { sendErrorToDiscord } from "@/lib/discord";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const { prompt, system, messages } = await request.json();

        // Support both old generic prompt and new chat history format
        const chatMessages = messages || [
            { role: "system", content: system || "You are a helpful assistant." },
            { role: "user", content: prompt },
        ];

        if (!chatMessages || chatMessages.length === 0) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 });
        }

        // Run the Agent Loop
        const result = await runAgentLoop(chatMessages);

        // Return format matches client expectation
        return NextResponse.json({ response: result.text, tasks: result.tasks, process: result.process });
    } catch (error: unknown) {
        console.error("AI Route Error:", error);

        if (error instanceof AIProviderError) {
            console.error("AI Provider Details:", {
                status: error.status,
                code: error.code,
                details: error.details,
            });
            return NextResponse.json(
                {
                    error: error.message,
                    code: error.code,
                    ...(error.details ? { details: error.details } : {}),
                },
                { status: error.status },
            );
        }

        const message = error instanceof Error ? error.message : "Unknown error";
        await sendErrorToDiscord(error, "AI Route");
        return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
    }
}
