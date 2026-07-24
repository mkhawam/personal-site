"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer } from "@webcontainer/api";
import { Play, Loader2, Terminal as TerminalIcon, Package, ExternalLink } from "lucide-react";

/**
 * In-browser playground that boots a real Node.js runtime (WebContainer) and
 * runs my published npm package `ts-declaration-json` live — no server, no
 * install. Requires the page to be cross-origin isolated (see next.config.mjs
 * headers()); we feature-detect and fall back gracefully when it isn't.
 */

const PKG = "ts-declaration-json";
const PKG_VERSION = "1.0.5";

const SAMPLE = `type ButtonProps = {
  /** Text rendered inside the button */
  label: string;
  /** Fired when the button is clicked */
  onClick: () => void;
  /** Visual variant */
  variant?: "primary" | "ghost" | "danger";
  /** Disable interaction */
  disabled?: boolean;
};

export function Button(props: ButtonProps) {
  return props;
}
`;

const PACKAGE_JSON = JSON.stringify(
    {
        name: "ts-decl-playground",
        private: true,
        dependencies: { [PKG]: PKG_VERSION },
    },
    null,
    2,
);

// CommonJS: the package is CJS and getModuleDeclarations() is synchronous.
// It readdir's the path, so it takes a *directory* of TS files, not one file —
// the input lives in ./module/, and the parser extracts interface/type decls.
const RUNNER = `const { getModuleDeclarations } = require("${PKG}");
const fs = require("fs");
try {
  const result = getModuleDeclarations("./module");
  fs.writeFileSync("output.json", JSON.stringify(result, null, 2));
  console.log("\\n\u2713 parsed declarations \u2192 output.json");
} catch (e) {
  const msg = (e && e.message) || String(e);
  fs.writeFileSync("output.json", JSON.stringify({ error: msg }, null, 2));
  console.error("\\n\u2717 " + msg);
  process.exit(1);
}
`;

type Status =
    | "idle"
    | "unsupported"
    | "booting"
    | "installing"
    | "running"
    | "ready"
    | "error";

const STATUS_LABEL: Record<Status, string> = {
    idle: "Ready to run",
    unsupported: "Unsupported browser",
    booting: "Booting Node runtime…",
    installing: `Installing ${PKG}…`,
    running: "Running…",
    ready: "Done",
    error: "Error",
};

export default function Playground() {
    const [code, setCode] = useState(SAMPLE);
    const [log, setLog] = useState("");
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<Status>("idle");

    const wcRef = useRef<WebContainer | null>(null);
    const logRef = useRef<HTMLPreElement | null>(null);
    const busy = status === "booting" || status === "installing" || status === "running";

    // Keep the console pinned to the newest line as output streams in.
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [log]);

    const appendLog = useCallback((chunk: string) => {
        setLog((prev) => prev + chunk);
    }, []);

    const streamInto = useCallback(
        (stream: ReadableStream<string>) =>
            stream.pipeTo(
                new WritableStream({
                    write: (chunk) => appendLog(chunk),
                }),
            ),
        [appendLog],
    );

    const run = useCallback(async () => {
        // The whole feature depends on cross-origin isolation (SharedArrayBuffer).
        if (typeof window !== "undefined" && !window.crossOriginIsolated) {
            setStatus("unsupported");
            return;
        }

        try {
            let wc = wcRef.current;

            if (!wc) {
                setStatus("booting");
                appendLog("$ boot node runtime\n");
                const { WebContainer } = await import("@webcontainer/api");
                wc = await WebContainer.boot();
                wcRef.current = wc;

                await wc.mount({
                    "package.json": { file: { contents: PACKAGE_JSON } },
                    "runner.cjs": { file: { contents: RUNNER } },
                    // getModuleDeclarations() reads a directory, so the source
                    // lives in module/, not at the project root.
                    module: {
                        directory: {
                            "input.ts": { file: { contents: code } },
                        },
                    },
                });

                setStatus("installing");
                appendLog(`\n$ npm install ${PKG}@${PKG_VERSION}\n`);
                const install = await wc.spawn("npm", ["install", "--no-audit", "--no-fund"]);
                streamInto(install.output);
                const installCode = await install.exit;
                if (installCode !== 0) {
                    appendLog("\nnpm install failed\n");
                    setStatus("error");
                    return;
                }
            } else {
                await wc.fs.writeFile("module/input.ts", code);
            }

            setStatus("running");
            appendLog("\n$ node runner.cjs\n");
            const proc = await wc.spawn("node", ["runner.cjs"]);
            streamInto(proc.output);
            await proc.exit;

            const result = await wc.fs.readFile("output.json", "utf-8");
            setOutput(result);
            setStatus("ready");
        } catch (err) {
            appendLog("\n" + (err instanceof Error ? err.message : String(err)) + "\n");
            setStatus("error");
        }
    }, [code, appendLog, streamInto]);

    if (status === "unsupported") {
        return <UnsupportedFallback />;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <StatusDot status={status} />
                    <span className="text-sm font-mono text-base-content/70">
                        {STATUS_LABEL[status]}
                    </span>
                </div>
                <button
                    onClick={run}
                    disabled={busy}
                    className="btn btn-sm bg-primary text-primary-content hover:bg-primary/90 border-none disabled:opacity-60"
                >
                    {busy ?
                        <Loader2 size={16} className="animate-spin" />
                    :   <Play size={16} />}
                    {busy ? STATUS_LABEL[status] : "Run"}
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                {/* Editor */}
                <div className="rounded-2xl border border-base-content/10 overflow-hidden bg-base-200">
                    <div className="px-4 py-2 border-b border-base-content/10 flex items-center gap-2 text-xs font-mono text-base-content/50">
                        <TerminalIcon size={13} aria-hidden /> input.ts
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck={false}
                        aria-label="TypeScript source"
                        className="w-full h-80 md:h-96 bg-transparent text-base-content/90 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
                    />
                </div>

                {/* Output */}
                <div className="rounded-2xl border border-base-content/10 overflow-hidden bg-base-200 flex flex-col">
                    <div className="px-4 py-2 border-b border-base-content/10 flex items-center gap-2 text-xs font-mono text-base-content/50">
                        <Package size={13} aria-hidden /> declarations.json
                    </div>
                    <pre className="flex-1 h-80 md:h-96 overflow-auto bg-transparent text-base-content/90 font-mono text-xs p-4 leading-relaxed">
                        {output || "// Output appears here after you Run.\n// The parser reads input.ts and returns its type declarations as JSON."}
                    </pre>
                </div>
            </div>

            {/* Console — the real install/run log, streamed. Proof it's genuinely running Node. */}
            <div className="rounded-2xl overflow-hidden border border-base-content/10">
                <div className="px-4 py-2 bg-black/60 border-b border-white/10 flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <TerminalIcon size={13} aria-hidden /> console
                </div>
                <pre
                    ref={logRef}
                    className="bg-black text-zinc-100 font-mono text-xs p-4 h-40 overflow-auto leading-relaxed whitespace-pre-wrap"
                >
                    {log || "root@webcontainer:~$ press Run to boot a real Node.js runtime in your browser"}
                </pre>
            </div>
        </div>
    );
}

function StatusDot({ status }: { status: Status }) {
    const color =
        status === "ready" ? "bg-success"
        : status === "error" ? "bg-error"
        : status === "idle" ? "bg-base-content/40"
        : "bg-warning animate-pulse";
    return <span className={`w-2.5 h-2.5 rounded-full ${color}`} aria-hidden />;
}

function UnsupportedFallback() {
    return (
        <div className="rounded-2xl border border-base-content/10 bg-base-200 p-8 text-center space-y-4">
            <p className="text-base-content/80">
                This playground boots a real Node.js runtime in your browser, which needs a
                cross-origin-isolated context your current browser doesn&apos;t provide.
            </p>
            <p className="text-sm text-base-content/60">
                It works in recent Chromium and Firefox. In the meantime, the package is on npm:
            </p>
            <a
                href={`https://www.npmjs.com/package/${PKG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm bg-primary text-primary-content hover:bg-primary/90 border-none inline-flex"
            >
                {PKG} on npm
                <ExternalLink size={14} aria-hidden />
            </a>
        </div>
    );
}
