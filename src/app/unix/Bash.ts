import { commands } from "./AccessoryBins";
import { FileSystem } from "./FileSystem";
import { parseArgs } from "./Utils";

export class Bash {
    name: string;
    description: string;
    version: string;
    license: string;
    user: { id: number; name: string };
    group: { id: number; name: string };
    fs: FileSystem;
    history: string[];
    hostname: string;

    constructor(hostname: string = "fedora") {
        this.hostname = hostname;
        this.name = "Bash";
        this.description = "A Unix shell and command language.";
        this.version = "5.0";
        this.license = "GPLv3";
        this.user = {
            id: 0,
            name: "root",
        };
        this.group = {
            id: 0,
            name: "root",
        };
        this.fs = new FileSystem(this.user.id);
        this.history = [];
        this.fs.cd("/root/personal-site");
    }
    getPrompt() {
        return `${this.user.name}@${this.hostname}:${this.fs.pwd()}$ `;
    }

    /**
     * Built from the actual switch cases below plus the AccessoryBins registry,
     * so `help` can't drift from what the shell really implements.
     */
    static readonly BUILTINS = [
        "ls", "cd", "pwd", "mkdir", "rmdir", "rm", "touch", "cat", "echo",
        "clear", "help", "uname", "whoami", "groups", "hostname", "history",
        "id", "yes", "true", "false", "neofetch", "projects", "blog", "open",
    ];

    static neofetch(hostname: string): string {
        return [
            "        _    _                              ",
            "  _ __ | | _| |__   __ ___      ____ _ _ __ ",
            " | '  \\| |/ / '_ \\ / _` \\ \\ /\\ / / _` | '  \\",
            " |_|_|_|_|\\_\\_.__/ \\__,_|\\_/\\_/ \\__,_|_|_|_|",
            "",
            `  root@${hostname}`,
            "  -----------------------------------------",
            "  Role   : Application Developer @ Rutgers",
            "  Stack  : TypeScript · Python · Django · Next.js · Ansible",
            "  Focus  : Platforms · Infra automation · Security",
            "  Shell  : bash 5.0 (simulated)",
            "  Links  : github.com/mkhawam · linkedin.com/in/mohamad-k",
            "",
            "  Try: projects · blog · cat resume.md · open github",
        ].join("\n");
    }

    static commandNames(): string[] {
        return [...Bash.BUILTINS, ...Object.keys(commands)];
    }

    getHistory(): string[] {
        return this.history;
    }

    static help(): string {
        const all = [...Bash.BUILTINS, ...Object.keys(commands)].sort();
        return `Available commands: ${all.join(", ")}\n\nLooking for the CV? Try: cat resume.md`;
    }

    async executeCommand(command: string): Promise<string | void | null> {
        // Simulate command execution
        this.history.push(command);
        const commandParts = command.split(" ");
        const commandName = commandParts[0];
        const args = commandParts.slice(1);
        if (process.env.NODE_ENV === "development") {
            console.log(`Executing command: ${command} with args: ${args}`);
            console.log(parseArgs(args));
        }

        // To-do: change this to a map
        switch (commandName) {
            case "ls":
                return this.fs.ls(args);
            case "cd":
                return this.fs.cd(args[0]);
            case "pwd":
                return this.fs.pwd();
            case "mkdir":
                return this.fs.mkdir(args[0]);
            case "rmdir":
                return this.fs.rmdir(args[0]);
            case "rm":
                return this.fs.rm(args[0]);
            case "touch":
                return this.fs.touch(args[0]);
            case "cat":
                return this.fs.cat(args[0]);
            case "echo":
                if (args.includes(">>")) {
                    const index = args.indexOf(">>");
                    const fileName = args[index + 1];
                    const content = args.slice(0, index).join(" ");
                    return this.fs.write(fileName, content);
                }
                return args.join(" ");
            case "clear":
                return null; // Clear the terminal output\
            case "help":
                return Bash.help();
            case "yes":
                return `y`;
            case "true":
                return `true`;
            case "false":
                return `false`;
            case "uname":
                return `Linux ${this.hostname} 5.0.0-0.bpo.2-amd64 #1 SMP Debian 5.0.2-1~bpo9+1 (2019-05-24) x86_64 GNU/Linux`;
            case "whoami":
                return this.user.name;
            case "groups":
                return this.group.name;
            case "hostname":
                return this.hostname;
            case "history":
                return this.history.join("\n");
            case "id":
                return `uid=${this.user.id}(${this.user.name}) gid=${this.group.id}(${this.group.name})`;
            case "neofetch":
                return Bash.neofetch(this.hostname);
            case "projects":
                return [
                    "Selected work — full detail at /projects (try: open projects)",
                    "",
                    "  codePost              grading platform · Django · React · Celery",
                    "  Accessibility Scanner Flask · Next.js · Playwright · Axe",
                    "  next-cas-client       published npm package · CAS SSO for Next.js",
                    "  Jackal                Suricata network behaviour analysis",
                    "  CompLock              SSH C2 for CCDC blue teams",
                ].join("\n");
            case "blog":
                return [
                    "Posts — read them at /blog (try: open blog)",
                    "",
                    "  OpenSSH Backdoor using Compression Library",
                    "  Leaky Endpoints in Jersey CTF 2025",
                    "  The Imposter Among Us",
                    "  Limited Worldview",
                    "  Code To Understand",
                ].join("\n");
            case "open": {
                const targets: { [key: string]: string } = {
                    github: "https://github.com/mkhawam",
                    linkedin: "https://linkedin.com/in/mohamad-k",
                    site: "https://mohamadk.com",
                    projects: "/projects",
                    playground: "/playground",
                    blog: "/blog",
                    resume: "/scripts/resume.pdf",
                };
                const key = (args[0] || "").toLowerCase();
                const dest = targets[key] || (/^https?:\/\//.test(args[0] || "") ? args[0] : null);
                if (!dest) {
                    return `open: unknown target '${args[0] || ""}'. Try: ${Object.keys(targets).join(", ")}`;
                }
                if (typeof window !== "undefined") {
                    if (dest.startsWith("/")) window.location.href = dest;
                    else window.open(dest, "_blank", "noopener,noreferrer");
                }
                return `opening ${dest} ...`;
            }

            default:
                // Check if the command is a valid executable in the file system
                if (commands[commandName]) {
                    const commandObj = commands[commandName];
                    return await commandObj.executable(args);
                }

                return `bash: ${commandName}: command not found`;
        }
    }
}
