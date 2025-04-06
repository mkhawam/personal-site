type Args = {
    args: string[];
    options: {
        [key: string]: {
            name: string;
            value: string | boolean;
            description: string;
            original: string;
        };
    };
    original: string[];
};

export function parseArgs(args: string[]): Args {
    const parsedArgs: Args = {
        args: [],
        options: {},
        original: args,
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("-")) {
            const key = args[i].substring(1);
            parsedArgs.options[key] = {
                name: key,
                value: true,
                description: "",
                original: args[i],
            };
        } else {
            parsedArgs.args.push(args[i]);
        }
    }
    return parsedArgs;
}
