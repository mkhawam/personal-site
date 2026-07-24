export type SubTask = {
    id: string;
    text: string;
    completed: boolean;
};

export type Attachment = {
    id: string;
    name: string;
    url: string;
    type: "link";
};

export type TaskList = {
    id: string;
    name: string;
};

export type Task = {
    id: string;
    listId?: string;
    text: string;
    completed: boolean;
    subtasks: SubTask[];
    notes?: string;
    archived?: boolean;
    priority?: "low" | "medium" | "high";
    attachments?: Attachment[];
    dueDate?: string;
    estimatedPomos?: number;
    actualPomos?: number;
    recurrence?: "daily" | "weekly" | "monthly" | null;
    lastCompletedDate?: string;
    tags?: string[];
    // Both optional so pre-existing localStorage data, old backups, and old
    // encrypted sync blobs keep loading. Missing updatedAt = epoch 0 in merge.
    updatedAt?: string;
    deletedAt?: string; // tombstone — kept so sync can propagate deletes, purged after 30d
};

export type TaskTag = {
    id: string;
    label: string;
    color: string; // tailwind class e.g. bg-info
};

export const TASK_TAGS: TaskTag[] = [
    { id: "work", label: "Work", color: "bg-blue-500" },
    { id: "personal", label: "Personal", color: "bg-green-500" },
    { id: "urgent", label: "Urgent", color: "bg-red-500" },
    { id: "ideas", label: "Ideas", color: "bg-purple-500" },
    { id: "learning", label: "Learning", color: "bg-amber-500" },
];
