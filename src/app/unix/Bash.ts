import { FileSystem } from "./FileSystem";

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

    executeCommand(command: string): string | void | null {
        // Simulate command execution
        this.history.push(command);
        console.log(`Executing: ${command}`);

        const commandParts = command.split(" ");
        const commandName = commandParts[0];
        const args = commandParts.slice(1);
        console.log(`Command: ${commandName}, Args: ${args}`);
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
                return `Available commands: ls, cd, pwd, mkdir, rmdir, rm, touch, cat, echo, clear, help , exit , uname, whoami, groups, hostname, yes, true, false`;
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
            default:
                return `bash: ${commandName}: command not found`;
        }
    }
}
