import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Task {
  id: string;
  type: 'video' | 'image' | 'music' | 'voice';
  prompt: string;
  status: 'Processing' | 'Success' | 'Fail' | 'Queuing';
  resultUrl?: string;
  createdAt: number;
  errorMessage?: string;
}

interface TasksState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
    }),
    {
      name: 'minimax-tasks',
    }
  )
);


