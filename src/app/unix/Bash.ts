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
            case "id":
                return `uid=${this.user.id}(${this.user.name}) gid=${this.group.id}(${this.group.name})`;

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
