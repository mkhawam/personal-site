const users = {
    0: "root",
    1: "daemon",
    2: "bin",
    3: "sys",
    4: "adm",
    5: "tty",
    6: "disk",
    7: "lp",
    8: "mail",
    9: "news",
    10: "uucp",
    100: "nobody",
    1000: "khawa",
};
const groups = {
    0: "root",
    1: "daemon",
    2: "bin",
    3: "sys",
    4: "adm",
    5: "tty",
    6: "disk",
    7: "lp",
    8: "mail",
    9: "news",
    10: "uucp",
    100: "nobody",
    1000: "khawa",
};
export function GetUserNameFromID(userId: number): string {
    return users[userId as keyof typeof users] || "unknown";
}
export function GetGroupNameFromID(groupId: number): string {
    return groups[groupId as keyof typeof groups] || "unknown";
}
