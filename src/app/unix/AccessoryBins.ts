import { parseArgs } from "./Utils";
import { sha256 } from "js-sha256";
type executable = (args: string[]) => string | void | Promise<string | void>;
type command = {
    name: string;
    description: string;
    executable: executable;
};
type commandList = {
    [key: string]: command;
};

export const commands: commandList = {
    hash: {
        name: "hash",
        description: "Display or manipulate the command hash table.",
        executable: (args: string[]) => {
            const parsedArgs = parseArgs(args);
            const options = parsedArgs.options;

            const hash = sha256.update(parsedArgs.args.join(" "));
            if (options["h"]) {
                return hash.hex();
            }
            if (options["b"]) {
                return hash.array().toString();
            }
            return hash.hex();
        },
    },
    ping: {
        name: "ping",
        description: "Send ICMP ECHO_REQUEST to network hosts.",
        executable: async (args: string[]) => {
            const parsedArgs = parseArgs(args);
            const options = parsedArgs.options;

            // check if valid ip address
            const ipRegex =
                /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            if (!parsedArgs.args[0].match(ipRegex)) {
                return `ping: ${parsedArgs.args[0]}: Name or service not known`;
            }
            if (parsedArgs.args.length > 1) {
                return `ping: only one host is allowed.`;
            }
            // would like to use node to ping the ip address, maybe using webcontainers
            var result = `PING ${parsedArgs.args[0]} (${parsedArgs.args[0]}) 56(84) bytes of data.`;

            const response = await fetch("/api/ping", {
                method: "POST",
                body: JSON.stringify({ ip: parsedArgs.args[0] }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.status !== 200) {
                return `PING: ${parsedArgs.args[0]}: Name or service not known`;
            }
            const data = await response.json();

            return result + "\n" + data.output;
        },
    },
    sl: {
        name: "sl",
        description: "Steam Locomotive",
        executable: () => {
            return `
⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⠀⠀⠀⠀⠀⠀
⠀⠛⠿⠿⠿⠿⠿⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠿⣿⣿⣿⣿⣿⣶⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠻⠿⠿⠟⠀⠀⠀⠀
⠀⣤⣤⣤⣤⣤⣤⣤⣤⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣤⣤⣤⡄⠀⠀⠀
⠀⠀⢸⡇⣿⠀⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⠀⠀⠀⣿⣿⣿⠀⠀⠀⠀
⠀⢠⣼⣧⣿⣤⣤⣤⣿⣤⠀⠀⠀⠀⠀⠀⠀⠘⠛⠛⠀⠀⠀⠛⠛⠋⠀⠀⠀⠀
⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⠀⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⣿⣿⣿⡆⠀
⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⠀⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣾⣿⣿⠇⠀
⠀⢈⣉⣉⠉⠉⠉⠉⣉⡉⠀⠉⠉⠉⢉⣉⠉⠉⠉⠉⠉⢉⣉⠉⠉⠉⣉⡁⠀⠀
⠀⠸⠋⣁⣴⠃⣀⠘⢿⣿⣷⡄⢀⣄⠘⢿⣿⣷⡀⣠⣄⠻⣿⣿⣆⠀⣿⣷⠀⠀
⠀⢠⣤⣤⣤⠀⢻⣷⣄⠙⠛⠃⠘⠛⠓⠀⠙⠛⠃⠛⠛⠂⠈⢻⡟⠀⣿⣿⣆⠀
⠀⠀⠙⠛⠁⠀⠀⠙⠛⠛⠁⠀⠀⠈⠛⠛⠋⠁⠀⠀⠉⠛⠛⠋⠀⠀⠀⠀⠀⠀
            `;
        },
    },
};
