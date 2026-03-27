import { Plus } from "lucide-react";

import { TaskCard } from "@/components/tasks/TaskCard";

import type { Priority, TaskStatus } from "@prisma/client";

interface Task {
  id: string;
  taskNumber: number;
  title: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | Date | null;
  assignee: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  projectKey: string;
  onQuickCreate: (status: TaskStatus) => void;
}

export const KanbanColumn = ({
  status,
  label,
  tasks,
  projectKey,
  onQuickCreate,
}: KanbanColumnProps) => {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-foreground/3">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground/70">{label}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground/10 px-1.5 text-xs text-foreground/50">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onQuickCreate(status)}
          className="flex h-6 w-6 items-center justify-center rounded text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
          aria-label={`${label}にタスクを追加`}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} projectKey={projectKey} />
        ))}
      </div>
    </div>
  );
};
