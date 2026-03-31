"use client";

import { useCallback, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Task, useTasksStore } from "@/store/useTasksStore";
import { appConfig } from "@/config/appConfig";
import { Video, Loader2, PlayCircle, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { ApiError, apiRequest } from "@/lib/apiClient";
import { resolveFileDownloadUrl, useTaskPolling } from "@/lib/taskPolling";

export default function VideoPage() {
  const { apiKey } = useSettingsStore();
  const { tasks, addTask, updateTask } = useTasksStore();

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(appConfig.models.videoDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 展开状态管理
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 仅展示视频任务
  const videoTasks = tasks.filter(t => t.type === 'video');

  const autoExpand = useCallback((id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: true }));
  }, []);

  const queryVideoTask = useCallback(async (task: Task, key: string): Promise<Partial<Task>> => {
    const queryData = await apiRequest<{ status?: string; file_id?: string; error_message?: string }>({
      path: `/query/video_generation?task_id=${encodeURIComponent(task.id)}`,
      apiKey: key,
    });

    if (queryData.status === "Success") {
      if (!queryData.file_id) {
        return { status: "Fail" as const, errorMessage: "任务完成但未返回文件 ID" };
      }
      const downloadUrl = await resolveFileDownloadUrl(queryData.file_id, key);
      if (!downloadUrl) {
        return { status: "Fail" as const, errorMessage: "无法获取视频下载链接" };
      }
      return { status: "Success" as const, resultUrl: downloadUrl };
    }
    if (queryData.status === "Fail") {
      return { status: "Fail" as const, errorMessage: queryData.error_message || "未知错误" };
    }
    return { status: "Processing" as const };
  }, []);

  useTaskPolling({
    apiKey,
    tasks,
    type: "video",
    intervalMs: 5000,
    queryTask: queryVideoTask,
    updateTask,
    autoExpand,
  });

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const createData = await apiRequest<{ task_id: string }>({
        path: "/video_generation",
        method: "POST",
        apiKey,
        body: {
          prompt: prompt,
          model: model,
        },
      });

      addTask({
        id: createData.task_id,
        type: 'video',
        prompt,
        status: 'Queuing',
        createdAt: Date.now()
      });

      setPrompt("");

    } catch (error: unknown) {
      const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "未知错误";
      setErrorMsg(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/65 dark:bg-zinc-900/55 backdrop-blur-xl p-6 md:p-8 overflow-y-auto rounded-3xl border border-white/70 dark:border-zinc-800 shadow-xl">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-600" />
            视频生成 (Hailuo)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            提交视频生成任务，任务会在后台排队生成，不影响您的其他操作。
          </p>
        </div>

        {!apiKey && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50">
            请先在左下角设置中配置您的 MiniMax API Key
          </div>
        )}

        <div className="bg-white/80 dark:bg-zinc-900/80 rounded-2xl p-6 border border-gray-200/80 dark:border-zinc-700 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              模型选择
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full md:w-64 px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              disabled={isSubmitting || !apiKey}
            >
              {appConfig.models.videoOptions.map((videoModel) => (
                <option key={videoModel} value={videoModel}>
                  {videoModel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              画面描述 (Prompt)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：镜头拍摄一个女性坐在咖啡馆里，女人抬头看着窗外，镜头缓缓移动拍摄到窗外的街道，画面呈现暖色调..."
              className="w-full h-32 px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white"
              disabled={isSubmitting || !apiKey}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-red-500">
              {errorMsg}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isSubmitting || !prompt.trim() || !apiKey}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              提交任务
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">任务列表</h2>
          {videoTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无任务</p>
          ) : (
            <div className="grid gap-4">
              {videoTasks.map(task => {
                const isExpanded = expandedTasks[task.id] ?? false;

                return (
                  <div key={task.id} className="bg-white/90 dark:bg-zinc-900/90 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3 transition-all">
                    <div
                      className="flex items-start justify-between cursor-pointer group"
                      onClick={() => toggleTask(task.id)}
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 flex-1 pr-4 group-hover:text-blue-600 transition-colors">
                        <span className="font-semibold mr-2">Prompt:</span>
                        {task.prompt}
                      </p>
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="text-xs font-medium">
                          {task.status === 'Success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 完成</span>}
                          {task.status === 'Fail' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> 失败</span>}
                          {(task.status === 'Processing' || task.status === 'Queuing') &&
                            <span className="text-blue-600 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin"/> {task.status === 'Queuing' ? '排队中' : '生成中'}</span>
                          }
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                          <Clock className="w-3 h-3" />
                          {new Date(task.createdAt).toLocaleString()}
                        </div>

                        {task.status === 'Fail' && task.errorMessage && (
                          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            {task.errorMessage}
                          </div>
                        )}

                        {task.status === 'Success' && task.resultUrl && (
                          <div className="mt-2 aspect-video w-full max-w-xl rounded-lg overflow-hidden bg-black">
                            <video
                              controls
                              src={task.resultUrl}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
