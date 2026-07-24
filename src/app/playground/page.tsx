import type { Metadata } from "next";
import Playground from "./Playground";

export const metadata: Metadata = {
    title: "Playground",
    description:
        "Run ts-declaration-json live in your browser — a real Node.js runtime, booted client-side with WebContainer, parsing TypeScript into JSON declarations.",
    alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
    return (
        <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-base-100 via-base-200 to-base-100">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <p className="text-xs md:text-sm font-mono uppercase tracking-[0.2em] text-primary">
                        Runs in your browser · no server
                    </p>
                    <h1 className="mt-3 text-4xl md:text-6xl font-extrabold text-base-content tracking-tight">
                        Playground
                    </h1>
                    <p className="mt-4 text-lg text-base-content/70 max-w-prose">
                        This boots a real Node.js runtime <em>inside your browser tab</em> with{" "}
                        <a
                            href="https://webcontainers.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            WebContainer
                        </a>
                        , installs my published npm package{" "}
                        <a
                            href="https://www.npmjs.com/package/ts-declaration-json"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-mono"
                        >
                            ts-declaration-json
                        </a>
                        , and runs it on the TypeScript you write — extracting its type
                        declarations as JSON. Nothing hits a server; watch the console to see it
                        genuinely install and execute.
                    </p>
                </header>
                <Playground />
            </div>
        </div>
    );
}
