"use client";

import { useState, useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useChatStore } from "@/store/useChatStore";
import { appConfig } from "@/config/appConfig";
import { Send, Bot, User, PlusCircle, MessageSquare, Trash2 } from "lucide-react";

export default function ChatPage() {
  const { apiKey } = useSettingsStore();
  const {
    sessions,
    activeSessionId,
    createSession,
    setActiveSession,
    deleteSession,
    addMessage
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化时如果没有会话则创建一个
  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, isLoading]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleSend = async () => {
    if (!input.trim() || !apiKey || !activeSession) return;

    const userMsg = input.trim();
    setInput("");

    // 添加用户消息到 store
    addMessage(activeSession.id, { role: "user", content: userMsg });
    setIsLoading(true);

    try {
      const response = await fetch(`${appConfig.apiBaseUrl}/text/chatcompletion_v2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: appConfig.models.chatDefault,
          messages: [
            ...activeSession.messages.map((m) => ({
              role: m.role === "bot" ? "assistant" : "user",
              content: m.content,
            })),
            { role: "user", content: userMsg },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
        throw new Error(data.base_resp?.status_msg || data.error?.message || `API Error: ${response.status}`);
      }

      const botMsg = data.choices?.[0]?.message?.content || JSON.stringify(data);

      addMessage(activeSession.id, { role: "bot", content: botMsg });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      addMessage(activeSession.id, { role: "bot", content: `请求失败: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-zinc-950">
      {/* 历史记录侧边栏 */}
      <div className="w-64 border-r border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => createSession()}
            className="flex items-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors justify-center font-medium"
          >
            <PlusCircle className="w-5 h-5" />
            新建对话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors group ${
                activeSessionId === session.id
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-sm truncate">{session.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 聊天主区域 */}
      <div className="flex-1 flex flex-col h-full relative">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            请选择或新建一个对话
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-4 max-w-3xl mx-auto ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user" ? "bg-blue-600" : "bg-emerald-600"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100 rounded-tr-none"
                        : "bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-gray-100 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4 max-w-3xl mx-auto">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-zinc-800 rounded-tl-none">
                    <div className="flex gap-1 items-center h-6">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-zinc-950">
              <div className="max-w-3xl mx-auto relative flex items-end gap-2">
                {!apiKey && (
                  <div className="absolute -top-10 left-0 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50">
                    请先在左下角设置中配置 API Key
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="输入消息..."
                  className="flex-1 max-h-48 min-h-[56px] px-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  rows={1}
                  disabled={!apiKey || isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !apiKey || isLoading}
                  className="p-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
