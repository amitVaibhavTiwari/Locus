import { Task } from "@/components/kanban/KanbanBoard";

export type SubGroupBy = "none" | "assignee" | "reporter" | "sprint" | "labels";

export const subGroupOptions: { value: SubGroupBy; label: string }[] = [
  { value: "none", label: "None" },
  { value: "assignee", label: "Assignee" },
  { value: "reporter", label: "Reporter" },
  { value: "sprint", label: "Sprint" },
  { value: "labels", label: "Labels" },
];

export const subGroupLabels: Record<SubGroupBy, string> = {
  none: "None",
  assignee: "Assignee",
  reporter: "Reporter",
  sprint: "Sprint",
  labels: "Label",
};

export interface SubGroup {
  key: string;
  label: string;
  initials?: string;
  tasks: Task[];
}

export function getTaskGroupKey(
  task: Task,
  by: SubGroupBy,
): { key: string; label: string; initials?: string } {
  switch (by) {
    case "assignee":
      return task.assignee
        ? {
            key: task.assignee.name,
            label: task.assignee.name,
            initials: task.assignee.initials,
          }
        : { key: "__none", label: "Unassigned" };
    case "reporter":
      return task.reporter
        ? {
            key: task.reporter.name,
            label: task.reporter.name,
            initials: task.reporter.initials,
          }
        : { key: "__none", label: "No Reporter" };
    case "sprint":
      return {
        key: task.sprint || "__none",
        label: task.sprint || "No Sprint",
      };
    case "labels":
      return task.labels && task.labels.length
        ? { key: task.labels[0], label: task.labels[0] }
        : { key: "__none", label: "No Label" };
    default:
      return { key: "__all", label: "" };
  }
}

export function groupTasks(tasks: Task[], by: SubGroupBy): SubGroup[] {
  if (by === "none") return [{ key: "__all", label: "", tasks }];
  const map = new Map<string, SubGroup>();
  tasks.forEach((t) => {
    const g = getTaskGroupKey(t, by);
    if (!map.has(g.key))
      map.set(g.key, {
        key: g.key,
        label: g.label,
        initials: g.initials,
        tasks: [],
      });
    map.get(g.key)!.tasks.push(t);
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.key === "__none") return 1;
    if (b.key === "__none") return -1;
    return a.label.localeCompare(b.label);
  });
}
