import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/apiClient";
import { Task } from "@/store/useTasksStore";

type UseTaskPollingOptions = {
  apiKey: string;
  tasks: Task[];
  type: Task["type"];
  intervalMs: number;
  queryTask: (task: Task, apiKey: string) => Promise<Partial<Task> | null>;
  updateTask: (id: string, updates: Partial<Task>) => void;
  autoExpand: (id: string) => void;
};

export function useTaskPolling({
  apiKey,
  tasks,
  type,
  intervalMs,
  queryTask,
  updateTask,
  autoExpand,
}: UseTaskPollingOptions) {
  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!apiKey) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      return;
    }

    const run = async () => {
      if (runningRef.current) {
        timerRef.current = window.setTimeout(run, intervalMs);
        return;
      }

      const pendingTasks = tasks.filter(
        (task) => task.type === type && (task.status === "Processing" || task.status === "Queuing")
      );

      if (pendingTasks.length === 0) {
        return;
      }

      runningRef.current = true;
      try {
        await Promise.allSettled(
          pendingTasks.map(async (task) => {
            try {
              const nextState = await queryTask(task, apiKey);
              if (nextState) {
                updateTask(task.id, nextState);
                if (nextState.status === "Success") {
                  autoExpand(task.id);
                }
              }
            } catch {
              updateTask(task.id, { status: task.status });
            }
          })
        );
      } finally {
        runningRef.current = false;
        timerRef.current = window.setTimeout(run, intervalMs);
      }
    };

    timerRef.current = window.setTimeout(run, 300);
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [apiKey, autoExpand, intervalMs, queryTask, tasks, type, updateTask]);
}

export async function resolveFileDownloadUrl(fileId: string, apiKey: string) {
  const fileData = await apiRequest<{ file?: { download_url?: string } }>({
    path: `/files/retrieve?file_id=${encodeURIComponent(fileId)}`,
    apiKey,
    timeoutMs: 120000,
  });
  return fileData.file?.download_url;
}
