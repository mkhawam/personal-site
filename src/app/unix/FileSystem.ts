import { GetUserNameFromID } from "./UserSystem";

function mapUnixPermissions(n: number): string {
    const permissionList = [];
    while (n > 0) {
        const current = Math.floor(n % 10);
        n = Math.floor(n / 10);
        if (current == 0) permissionList.push("---");
        if (current === 1) permissionList.push("--x");
        if (current === 2) permissionList.push("-w-");
        if (current === 4) permissionList.push("r--");
        if (current === 5) permissionList.push("r-x");
        if (current === 6) permissionList.push("rw-");
        if (current === 7) permissionList.push("rwx");
    }
    return permissionList.reverse().join("");
}

class Inode {
    name: string;
    filetype: "d" | "-" | "b" | "c" | "p" | "l" | "s";
    permissions: number;
    ownerId: number;
    groupId: number;
    size: number;
    lastAccessed: number;
    lastModified: number;
    links: { [path: string]: Inode | null } | null;
    inode_Number: number;
    content: string | null = null;
    static _nextInode = 0;
    constructor(
        name: string,
        filetype: "d" | "-" | "b" | "c" | "p" | "l" | "s",
        permissions: number = 744,
        ownerId: number = 0,
        groupId: number = 0,
        size: number = 0,
        lastAccessed: number = Date.now(),
        lastModified: number = Date.now()
    ) {
        this.name = name;
        this.filetype = filetype;
        this.permissions = permissions;
        this.ownerId = ownerId;
        this.groupId = groupId;
        this.size = size;
        this.lastAccessed = lastAccessed;
        this.lastModified = lastModified;
        this.links = this.filetype === "d" ? {} : null;
        this.inode_Number = Inode._generateInodeNumber();
    }
    static _generateInodeNumber() {
        return Inode._nextInode++;
    }
    getName(): string {
        return this.name;
    }
    addLink(name: string, inode: Inode): void {
        if (this.filetype !== "d") return;
        if (!this.links) return;
        if (this.links[name]) return;
        this.links[name] = inode;
    }
    getLink(name: string): Inode | null {
        if (this.filetype !== "d") return null;
        if (!this.links) return null;
        if (!this.links[name]) return null;
        return this.links[name];
    }
    removeLink(name: string): void {
        if (this.filetype !== "d") return;
        if (!this.links) return;
        if (!this.links[name]) return;
        delete this.links[name];
    }
    getSize(): number {
        if (this.filetype === "d") {
            let size = 0;
            for (const link in this.links) {
                if (this.links[link]) {
                    size += this.links[link].getSize();
                }
            }
            return size;
        } else {
            return this.size;
        }
    }
    getPermissions(): number {
        return this.permissions;
    }
    setPermissions(permissions: number): void {
        this.permissions = permissions;
    }
    getOwnerId(): number {
        return this.ownerId;
    }
    setOwnerId(ownerId: number): void {
        this.ownerId = ownerId;
    }
    getGroupId(): number {
        return this.groupId;
    }
    setGroupId(groupId: number): void {
        this.groupId = groupId;
    }
    getLastAccessed(): number {
        return this.lastAccessed;
    }
    setLastAccessed(lastAccessed: number): void {
        this.lastAccessed = lastAccessed;
    }
    getLastModified(): number {
        return this.lastModified;
    }
    setLastModified(lastModified: number): void {
        this.lastModified = lastModified;
    }
    getInodeNumber(): number {
        return this.inode_Number;
    }
    writeContent(content: string): void {
        if (this.filetype !== "-") return;
        this.content = content;
        this.size = content.length;
        this.lastModified = Date.now();
    }
    readContent(): string | null {
        if (this.filetype !== "-") return null;
        return this.content;
    }
    deleteContent(): void {
        if (this.filetype !== "-") return;
        this.content = null;
        this.size = 0;
        this.lastModified = Date.now();
    }

    getInfo(): string {
        const str = `${this.filetype}${mapUnixPermissions(this.permissions)} ${GetUserNameFromID(this.ownerId)} ${GetUserNameFromID(this.groupId)} ${
            this.size
        } ${new Date(this.lastModified).toLocaleString()} ${this.name}`;
        return str;
    }
}

export class FileSystem {
    root: Inode;
    cwd: Inode;
    pathStack: Inode[];
    UID: number;
    constructor(UID: number) {
        this.root = new Inode("/", "d");
        this.cwd = this.root;
        this.pathStack = [this.root];
        this.UID = UID;
        this.initFileSystem();
    }
    initFileSystem() {
        this.root.addLink("bin", new Inode("bin", "d"));
        this.root.addLink("boot", new Inode("boot", "d"));
        this.root.addLink("dev", new Inode("dev", "d"));
        this.root.addLink("etc", new Inode("etc", "d"));
        this.root.addLink("home", new Inode("home", "d"));
        this.root.addLink("lib", new Inode("lib", "d"));
        this.root.addLink("media", new Inode("media", "d"));
        this.root.addLink("mnt", new Inode("mnt", "d"));
        this.root.addLink("opt", new Inode("opt", "d"));
        this.root.addLink("proc", new Inode("proc", "d"));
        this.root.addLink("root", new Inode("root", "d"));

        const bin = this.root.getLink("bin");
        if (bin) {
            bin.addLink("bash", new Inode("bash", "-"));
            bin.addLink("cp", new Inode("cp", "-"));
            bin.addLink("ls", new Inode("ls", "-"));
            bin.addLink("mv", new Inode("mv", "-"));
            bin.addLink("rm", new Inode("rm", "-"));
            bin.addLink("touch", new Inode("touch", "-"));
        }
        const boot = this.root.getLink("boot");
        if (boot) {
            boot.addLink("grub", new Inode("grub", "-"));
            boot.addLink("initrd", new Inode("initrd", "-"));
            boot.addLink("vmlinuz", new Inode("vmlinuz", "-"));
        }
        const dev = this.root.getLink("dev");
        if (dev) {
            dev.addLink("null", new Inode("null", "-"));
            dev.addLink("zero", new Inode("zero", "-"));
            dev.addLink("tty", new Inode("tty", "-"));
            dev.addLink("random", new Inode("random", "-"));
            dev.addLink("urandom", new Inode("urandom", "-"));
            dev.addLink("console", new Inode("console", "-"));
            dev.addLink("ptmx", new Inode("ptmx", "-"));
            dev.addLink("tty0", new Inode("tty0", "-"));
            dev.addLink("tty1", new Inode("tty1", "-"));
            dev.addLink("tty2", new Inode("tty2", "-"));
            dev.addLink("tty3", new Inode("tty3", "-"));
            dev.addLink("tty4", new Inode("tty4", "-"));
            dev.addLink("tty5", new Inode("tty5", "-"));
            dev.addLink("tty6", new Inode("tty6", "-"));
            dev.addLink("tty7", new Inode("tty7", "-"));
            dev.addLink("tty8", new Inode("tty8", "-"));
            dev.addLink("tty9", new Inode("tty9", "-"));
            dev.addLink("tty10", new Inode("tty10", "-"));
            dev.addLink("tty11", new Inode("tty11", "-"));
            dev.addLink("tty12", new Inode("tty12", "-"));
            dev.addLink("tty13", new Inode("tty13", "-"));
            dev.addLink("tty14", new Inode("tty14", "-"));
            dev.addLink("tty15", new Inode("tty15", "-"));
            dev.addLink("tty16", new Inode("tty16", "-"));
            dev.addLink("stdout", new Inode("stdout", "-"));
            dev.addLink("stderr", new Inode("stderr", "-"));
            dev.addLink("stdin", new Inode("stdin", "-"));
            dev.addLink("ttyS0", new Inode("ttyS0", "-"));
            dev.addLink("ttyS1", new Inode("ttyS1", "-"));
            dev.addLink("ttyS2", new Inode("ttyS2", "-"));
        }
        const etc = this.root.getLink("etc");
        if (etc) {
            etc.addLink("hosts", new Inode("hosts", "-"));
            etc.addLink("passwd", new Inode("passwd", "-"));
            etc.addLink("shadow", new Inode("shadow", "-"));
            etc.addLink("group", new Inode("group", "-"));
            etc.addLink("resolv.conf", new Inode("resolv.conf", "-"));
            etc.addLink("fstab", new Inode("fstab", "-"));
            etc.addLink("network", new Inode("network", "-"));
            etc.addLink("hostname", new Inode("hostname", "-"));
            etc.addLink("motd", new Inode("motd", "-"));
            etc.addLink("issue", new Inode("issue", "-"));
            etc.addLink("profile", new Inode("profile", "-"));
            etc.addLink("bashrc", new Inode("bashrc", "-"));
            etc.addLink("ssh", new Inode("ssh", "d"));
            const ssh = etc.getLink("ssh");
            if (ssh) {
                ssh.addLink("sshd_config", new Inode("sshd_config", "-"));
                ssh.addLink("ssh_config", new Inode("ssh_config", "-"));
                ssh.addLink("known_hosts", new Inode("known_hosts", "-"));
            }
            etc.addLink("cron.d", new Inode("cron.d", "d"));
            const cronD = etc.getLink("cron.d");
            if (cronD) {
                cronD.addLink("cron.allow", new Inode("cron.allow", "-"));
                cronD.addLink("cron.deny", new Inode("cron.deny", "-"));
            }
            etc.addLink("cron.daily", new Inode("cron.daily", "d"));
            const cronDaily = etc.getLink("cron.daily");
            if (cronDaily) {
                cronDaily.addLink("logrotate", new Inode("logrotate", "-"));
                cronDaily.addLink("apt", new Inode("apt", "-"));
                cronDaily.addLink("dpkg", new Inode("dpkg", "-"));
            }
            etc.addLink("cron.hourly", new Inode("cron.hourly", "d"));
            const cronHourly = etc.getLink("cron.hourly");
            if (cronHourly) {
                cronHourly.addLink("logrotate", new Inode("logrotate", "-"));
                cronHourly.addLink("apt", new Inode("apt", "-"));
                cronHourly.addLink("dpkg", new Inode("dpkg", "-"));
            }
            etc.addLink("cron.weekly", new Inode("cron.weekly", "d"));
            const cronWeekly = etc.getLink("cron.weekly");
            if (cronWeekly) {
                cronWeekly.addLink("logrotate", new Inode("logrotate", "-"));
                cronWeekly.addLink("apt", new Inode("apt", "-"));
                cronWeekly.addLink("dpkg", new Inode("dpkg", "-"));
            }
            etc.addLink("cron.monthly", new Inode("cron.monthly", "d"));
            const cronMonthly = etc.getLink("cron.monthly");
            if (cronMonthly) {
                cronMonthly.addLink("logrotate", new Inode("logrotate", "-"));
                cronMonthly.addLink("apt", new Inode("apt", "-"));
                cronMonthly.addLink("dpkg", new Inode("dpkg", "-"));
            }
            etc.addLink("cron.allow", new Inode("cron.allow", "-"));
            etc.addLink("cron.deny", new Inode("cron.deny", "-"));
        }
        const home = this.root.getLink("home");
        if (home) {
            home.addLink("user", new Inode("user", "d"));
            const user = home.getLink("user");
            if (user) {
                user.addLink("documents", new Inode("documents", "d"));
                user.addLink("downloads", new Inode("downloads", "d"));
                user.addLink("music", new Inode("music", "d"));
                user.addLink("pictures", new Inode("pictures", "d"));
                user.addLink("videos", new Inode("videos", "d"));
            }
        }
        const lib = this.root.getLink("lib");
        if (lib) {
            lib.addLink("lib", new Inode("lib", "-"));
            lib.addLink("lib64", new Inode("lib64", "-"));
            lib.addLink("modules", new Inode("modules", "d"));
            const modules = lib.getLink("modules");
            if (modules) {
                modules.addLink("4.19.0-18-amd64", new Inode("4.19.0-18-amd64", "d"));
                const kernel = modules.getLink("4.19.0-18-amd64");
                if (kernel) {
                    kernel.addLink("kernel", new Inode("kernel", "d"));
                    const kernelDir = kernel.getLink("kernel");
                    if (kernelDir) {
                        kernelDir.addLink("drivers", new Inode("drivers", "d"));
                        kernelDir.addLink("fs", new Inode("fs", "d"));
                        kernelDir.addLink("net", new Inode("net", "d"));
                        kernelDir.addLink("sound", new Inode("sound", "d"));
                    }
                }
            }
            lib.addLink("firmware", new Inode("firmware", "d"));
            const firmware = lib.getLink("firmware");
            if (firmware) {
                firmware.addLink("ath10k", new Inode("ath10k", "d"));
                const ath10k = firmware.getLink("ath10k");
                if (ath10k) {
                    ath10k.addLink("QCA6174", new Inode("QCA6174", "d"));
                    const qca6174 = ath10k.getLink("QCA6174");
                    if (qca6174) {
                        qca6174.addLink("board.bin", new Inode("board.bin", "-"));
                        qca6174.addLink("firmware-6.bin", new Inode("firmware-6.bin", "-"));
                    }
                }
            }
            lib.addLink("locale", new Inode("locale", "d"));
            const locale = lib.getLink("locale");
            if (locale) {
                locale.addLink("locale.alias", new Inode("locale.alias", "-"));
                locale.addLink("locale.gen", new Inode("locale.gen", "-"));
                locale.addLink("locale-archive", new Inode("locale-archive", "-"));
            }
        }
        const media = this.root.getLink("media");
        if (media) {
            media.addLink("cdrom", new Inode("cdrom", "-"));
            media.addLink("floppy", new Inode("floppy", "-"));
            media.addLink("usb", new Inode("usb", "-"));
        }
        const mnt = this.root.getLink("mnt");
        if (mnt) {
            mnt.addLink("cdrom", new Inode("cdrom", "-"));
            mnt.addLink("floppy", new Inode("floppy", "-"));
            mnt.addLink("usb", new Inode("usb", "-"));
        }
        const opt = this.root.getLink("opt");
        if (opt) {
            opt.addLink("google", new Inode("google", "d"));
            opt.addLink("local", new Inode("local", "d"));
        }
        const proc = this.root.getLink("proc");
        if (proc) {
            proc.addLink("cpuinfo", new Inode("cpuinfo", "-"));
            proc.addLink("meminfo", new Inode("meminfo", "-"));
            proc.addLink("version", new Inode("version", "-"));
        }
        const root = this.root.getLink("root");
        if (root) {
            root.addLink("documents", new Inode("documents", "d"));
            root.addLink("downloads", new Inode("downloads", "d"));
            root.addLink("music", new Inode("music", "d"));
            root.addLink("pictures", new Inode("pictures", "d"));
            root.addLink("videos", new Inode("videos", "d"));
            root.addLink("personal-site", new Inode("personal-site", "d"));
            const personalSite = root.getLink("personal-site");
            if (personalSite) {
                personalSite.addLink("src", new Inode("src", "d"));
                personalSite.addLink("public", new Inode("public", "d"));
                personalSite.addLink("tsconfig.json", new Inode("tsconfig.json", "-"));
                personalSite.addLink("package.json", new Inode("package.json", "-"));
                personalSite.addLink("README.md", new Inode("README.md", "-"));
            }
        }
        const sbin = this.root.getLink("sbin");
        if (sbin) {
            sbin.addLink("reboot", new Inode("reboot", "-"));
            sbin.addLink("shutdown", new Inode("shutdown", "-"));
            sbin.addLink("init", new Inode("init", "-"));
        }
        const srv = this.root.getLink("srv");
        if (srv) {
            srv.addLink("ftp", new Inode("ftp", "d"));
            srv.addLink("http", new Inode("http", "d"));
        }
        const tmp = this.root.getLink("tmp");
        if (tmp) {
            tmp.addLink("tmp", new Inode("tmp", "-"));
        }
        const usr = this.root.getLink("usr");
        if (usr) {
            usr.addLink("bin", new Inode("bin", "d"));
            usr.addLink("include", new Inode("include", "d"));
            usr.addLink("lib", new Inode("lib", "d"));
            usr.addLink("local", new Inode("local", "d"));
            usr.addLink("sbin", new Inode("sbin", "d"));
            usr.addLink("share", new Inode("share", "d"));
        }
        const varDir = this.root.getLink("var");
        if (varDir) {
            varDir.addLink("cache", new Inode("cache", "d"));
            varDir.addLink("lib", new Inode("lib", "d"));
            varDir.addLink("local", new Inode("local", "d"));
            varDir.addLink("log", new Inode("log", "d"));
            varDir.addLink("run", new Inode("run", "d"));
            varDir.addLink("tmp", new Inode("tmp", "d"));
        }
    }
    findFromRoot(path: string): Inode | null {
        const pathList = path.split("/").filter((p) => p !== "" && p !== ".");
        let currentNode: Inode | null = this.root;
        for (const p of pathList) {
            if (!currentNode.links) return null;
            currentNode = currentNode.links[p] || null;
            if (!currentNode) return null;
        }
        return currentNode;
    }
    ls(args: string[]): string | void {
        const path = args[0] || ".";
        const mode = args[1] || "";

        function getInfo(targetInode: Inode): string {
            if (!targetInode) return "";
            if (!targetInode.links) return targetInode.getInfo();

            if (mode == "-l") {
                return Object.keys(targetInode.links)
                    .map((link) => {
                        const inode = targetInode.links![link];
                        if (!inode) return "";
                        return `${inode.getInfo()} `;
                    })
                    .join("\n");
            }
            return Object.keys(targetInode.links).join("\n");
        }

        if (path == "." || path == "" || path == "./" || !path) {
            return getInfo(this.cwd);
        }
        if (path.startsWith("/")) {
            // absolute path
            const targetInode = this.findFromRoot(path);
            if (!targetInode) return "No such file or directory";
            if (targetInode.filetype == "-") return "No such directory";
            if (!targetInode.links) return "No such file or directory";
            return getInfo(targetInode);
        }
        if (path.startsWith(".")) {
            // relative path
            // get absolute path from the current working directory
            const oldPath = this.pwd();
            const pathList = path.split("/");
            pathList.shift();
            const new_path = oldPath + "/" + pathList.join("/");

            return this.ls([new_path, mode]);
        }
        return "No such file or directory";
    }

    cd(path: string): void | string {
        const oldCwd = this.cwd;
        const oldPathStack = this.pathStack;

        if (path == "~") {
            if (this.UID == 0) {
                this.cwd = this.root.getLink("root")!;
                this.pathStack = [this.root, this.cwd];
            } else {
                const homeDirectory = this.root.getLink("home");
                if (!homeDirectory) {
                    return "No such file or directory";
                }

                let userDir = homeDirectory.getLink(GetUserNameFromID(this.UID));
                if (!userDir) {
                    return "No such file or directory";
                }
                this.cwd = userDir;
                this.pathStack = [this.root, homeDirectory, this.cwd];
            }
            return;
        }
        // cd to the home directory
        if (path.startsWith("~")) {
            if (typeof this.cd("~") == "string") {
                return "No such file or directory";
            }
            const pathList = path.split("/");
            pathList.shift();
            const directoryStack: Inode[] = this.pathStack;
            let cwd = this.cwd;
            for (let i = 0; i < pathList.length; i++) {
                if (!cwd.links) {
                    this.cwd = oldCwd;
                    this.pathStack = oldPathStack;
                    return "No such file or directory";
                }
                const nextNode = cwd.links[pathList[i]];

                if (!nextNode) {
                    this.cwd = oldCwd;
                    this.pathStack = oldPathStack;
                    return "No such file or directory";
                }

                if (cwd.filetype == "-") {
                    this.cwd = oldCwd;
                    this.pathStack = oldPathStack;
                    return "No such directory";
                }

                cwd = nextNode;
                directoryStack.push(cwd);
            }
            this.cwd = cwd;
            this.pathStack = directoryStack;
            return;
        }

        // change directory from absolute path
        if (path.startsWith("/")) {
            const pathList = path.split("/");
            pathList.shift();
            const directoryStack: Inode[] = [this.root];
            let cwd = this.root;

            for (let i = 0; i < pathList.length; i++) {
                if (!cwd.links) return "No such file or directory";
                const nextNode = cwd.links[pathList[i]];

                if (!nextNode) {
                    return "No such file or directory";
                }

                if (cwd.filetype == "-") {
                    return "No such directory";
                }

                cwd = nextNode;
                directoryStack.push(cwd);
            }
            this.cwd = cwd;
            this.pathStack = directoryStack;
            return;
        }

        // cd to the current directory
        if (path == ".") return;

        if (path == "..") {
            this.pathStack.pop();
            this.cwd = this.pathStack[this.pathStack.length - 1];
            return;
        }

        if (path.startsWith("./")) {
            const pathList = path.split("/");
            pathList.shift();
            const directoryStack: Inode[] = this.pathStack;
            let cwd = this.cwd;
            for (let i = 0; i < pathList.length; i++) {
                if (!cwd.links) {
                    this.cwd = oldCwd;
                    this.pathStack = oldPathStack;
                    return "No such file or directory";
                }
                const nextNode = cwd.links[pathList[i]];

                if (!nextNode) {
                    this.cwd = oldCwd;
                    this.pathStack = oldPathStack;
                    return "No such file or directory";
                }

                if (cwd.filetype == "-") {
                    this.cwd = oldCwd;
                    this.pathStack = oldPathStack;
                    return "No such directory";
                }

                cwd = nextNode;
                directoryStack.push(cwd);
            }
            this.cwd = cwd;
            this.pathStack = directoryStack;
            return;
        }

        // return if no links object
        if (!this.cwd.links) return;
        if (this.cwd.links[path] && this.cwd.links[path].filetype === "d") {
            this.cwd = this.cwd.links[path];
            this.pathStack.push(this.cwd);
            return;
        }
    }

    pwd() {
        return this.pathStack
            .map((dir) => dir.name)
            .join("/")
            .replace(/\/+/g, "/");
    }
    mkdir(path: string): void | string {
        if (path == "") return "No such file or directory";

        if (path.startsWith("/")) {
            const pathList = path.split("/");
            const dirName = pathList.pop() || "";
            const parentPath = pathList.join("/");

            if (parentPath == "") {
                return "No such file or directory";
            }

            const parentDir = this.findFromRoot(parentPath);
            if (!parentDir) return "No such file or directory";
            if (parentDir.filetype == "-") return "No such directory";

            const newDir = new Inode(dirName, "d", 744, this.UID, this.UID, 0, Date.now(), Date.now());
            parentDir.addLink(dirName, newDir);
        }
        if (path.startsWith(".")) {
            const pathList = path.split("/");
            pathList.shift();
            const newPath = this.pwd() + "/" + pathList.join("/");
            return this.mkdir(newPath);
        }
        if (path.indexOf("/") === -1) {
            const newDir = new Inode(path, "d", 744, this.UID, this.UID, 0, Date.now(), Date.now());
            this.cwd.addLink(path, newDir);
            return;
        }
    }
    rmdir(path: string): void | string {
        if (path.startsWith("/")) {
            const pathList = path.split("/");
            const dirName = pathList.pop() || "";
            const parentPath = pathList.join("/");

            if (parentPath == "") {
                return "No such file or directory";
            }

            const parentDir = this.findFromRoot(parentPath);
            if (!parentDir) return "No such file or directory";
            if (parentDir.filetype == "-") return "No such directory";

            const targetDir = parentDir.getLink(dirName);
            if (!targetDir) return "No such file or directory";
            if (targetDir.filetype !== "d") return "Not a directory";

            if (Object.keys(targetDir.links || {}).length > 0) {
                return "Directory not empty";
            }

            parentDir.removeLink(dirName);
        }
        if (path.startsWith(".")) {
            const pathList = path.split("/");
            pathList.shift();
            const newPath = this.pwd() + "/" + pathList.join("/");
            return this.rmdir(newPath);
        }
        if (path.indexOf("/") === -1) {
            const targetDir = this.cwd.getLink(path);
            if (!targetDir) return "No such file or directory";
            if (targetDir.filetype !== "d") return "Not a directory";

            if (Object.keys(targetDir.links || {}).length > 0) {
                return "Directory not empty";
            }

            this.cwd.removeLink(path);
            return;
        }
    }
    rm(path: string): void | string {
        if (path == "") return "No such file or directory";
        if (path.indexOf("/") === -1) {
            const targetFile = this.cwd.getLink(path);
            if (!targetFile) return "No such file or directory";
            if (targetFile.filetype !== "-") return "Not a file";

            this.cwd.removeLink(path);
            return;
        }
        if (path.startsWith("/")) {
            const pathList = path.split("/");
            const fileName = pathList.pop() || "";
            const parentPath = pathList.join("/");

            if (parentPath == "") {
                return "No such file or directory";
            }

            const parentDir = this.findFromRoot(parentPath);
            if (!parentDir) return "No such file or directory";
            if (parentDir.filetype == "-") return "No such directory";

            const targetFile = parentDir.getLink(fileName);
            if (!targetFile) return "No such file or directory";
            if (targetFile.filetype === "d") return "Is a directory";

            parentDir.removeLink(fileName);
        }
        if (path.startsWith(".")) {
            const pathList = path.split("/");
            pathList.shift();
            const newPath = this.pwd() + "/" + pathList.join("/");
            return this.rm(newPath);
        }
    }
    touch(path: string): void | string {
        if (path == "") return "No such file or directory";
        if (path.indexOf("/") === -1) {
            const newFile = new Inode(path, "-", 744, this.UID, this.UID, 0, Date.now(), Date.now());
            this.cwd.addLink(path, newFile);
            return;
        }
    }
    cat(path: string): string | null {
        if (path == "") return "No such file or directory";
        if (path.indexOf("/") === -1) {
            const targetFile = this.cwd.getLink(path);
            console.log(targetFile);
            if (!targetFile) return "No such file or directory";
            if (targetFile.filetype !== "-") return "Not a file";
            return targetFile.readContent();
        }
        if (path.startsWith("/")) {
            const pathList = path.split("/");
            const fileName = pathList.pop() || "";
            const parentPath = pathList.join("/");

            if (parentPath == "") {
                return "No such file or directory";
            }

            const parentDir = this.findFromRoot(parentPath);
            if (!parentDir) return "No such file or directory";
            if (parentDir.filetype == "-") return "No such directory";

            const targetFile = parentDir.getLink(fileName);
            if (!targetFile) return "No such file or directory";
            if (targetFile.filetype !== "-") return "Not a file";
            return targetFile.readContent();
        }
        if (path.startsWith(".")) {
            const pathList = path.split("/");
            pathList.shift();
            const newPath = this.pwd() + "/" + pathList.join("/");
            return this.cat(newPath);
        }
        return "No such file or directory";
    }
    write(path: string, content: string): void | string {
        console.log(path, content);
        if (path == "") return "No such file or directory";
        if (path.indexOf("/") === -1) {
            const targetFile = this.cwd.getLink(path);
            if (!targetFile) return "No such file or directory";
            if (targetFile.filetype !== "-") return "Not a file";
            targetFile.writeContent(content);
            return;
        }
        if (path.startsWith("/")) {
            const pathList = path.split("/");
            const fileName = pathList.pop() || "";
            const parentPath = pathList.join("/");

            if (parentPath == "") {
                return "No such file or directory";
            }

            const parentDir = this.findFromRoot(parentPath);
            if (!parentDir) return "No such file or directory";
            if (parentDir.filetype == "-") return "No such directory";

            const targetFile = parentDir.getLink(fileName);
            if (!targetFile) return "No such file or directory";
            if (targetFile.filetype !== "-") return "Not a file";
            return targetFile.writeContent(content);
        }
        if (path.startsWith(".")) {
            const pathList = path.split("/");
            pathList.shift();
            const newPath = this.pwd() + "/" + pathList.join("/");
            return this.write(newPath, content);
        }
        return "No such file or directory";
    }
}
