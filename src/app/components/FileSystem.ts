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
  static _nextInode = 0;
  constructor(
    name: string,
    filetype: "d" | "-" | "b" | "c" | "p" | "l" | "s",
    permissions: number = 744,
    ownerId: number = 0,
    groupId: number = 0,
    size: number = 0,
    lastAccessed: number = Date.now(),
    lastModified: number = Date.now(),
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

  getInfo(): string {
    const str = `${this.filetype}${mapUnixPermissions(this.permissions)} `;
    return str;
  }
}

class FileSystem {
  root: Inode;
  cwd: Inode;
  pathStack: Inode[];
  constructor() {
    this.root = new Inode("/", "d");
    this.cwd = this.root;
    this.pathStack = [this.root];
  }
  ls(path: string) {
    if (path == ".") {
    }
  }
  cd(path: string): void | string {
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

        if (cwd.filetype == "-" && i != pathList.length - 1) {
          return "No such file or directory";
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
}
