"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Sparkles } from "lucide-react";
import {
  sendAiChatMessage,
  fetchAllData,
  fetchSystemConfig,
} from "@/actions/miscActions";
import { useTransactionStore } from "@/store/useTransactionStore";

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      role: "ai",
      content: "I'm your financial co-pilot. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const { setTransactions, setAccounts, setBudgets, setCategories } =
    useTransactionStore();

  useEffect(() => {
    const checkConfig = async () => {
      const res = await fetchSystemConfig();
      if (res.success && res.data.enableAI) {
        setIsEnabled(true);
      }
    };
    checkConfig();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  if (!isEnabled) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage("");
    setChat((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await sendAiChatMessage(userMessage);
      if (res.success) {
        setChat((prev) => [...prev, { role: "ai", content: res.data.reply }]);

        if (res.data.intent === "CREATE_TRANSACTION") {
          const data = await fetchAllData();
          if (data) {
            setTransactions(data.transactions);
            setAccounts(data.accounts);
            setBudgets(data.budgets);
            setCategories(data.categories);
          }
        }
      } else {
        setChat((prev) => [
          ...prev,
          {
            role: "ai",
            content: "I encountered a synchronization error. Please try again.",
          },
        ]);
      }
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          content: "System fault. AI services are currently unstable.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-foreground text-background rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-40 group"
      >
        <Sparkles
          size={24}
          className="group-hover:rotate-12 transition-transform"
        />
      </button>

      {isOpen && (
        <div className="fixed bottom-8 right-8 w-100 h-150 bg-background border border-foreground shadow-[12px_12px_0px_0px_rgba(var(--foreground-rgb),0.1)] z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-foreground flex items-center justify-between bg-foreground text-background">
            <div className="flex items-center gap-3">
              <Bot size={20} />
              <span className="text-xs font-black uppercase tracking-widest">
                Financial Intelligence
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:rotate-90 transition-transform"
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
          >
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 text-xs font-bold leading-relaxed ${
                    msg.role === "user"
                      ? "bg-muted/10 text-foreground border border-foreground/5 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
                      : "bg-foreground text-background rounded-tl-2xl rounded-tr-2xl rounded-br-2xl"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-foreground text-background p-4 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-background rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-background rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-background rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="p-6 border-t border-foreground bg-muted/5"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="LOG TRANSACTION OR ASK..."
                className="w-full bg-transparent border-b border-foreground/20 py-2 pr-10 text-xs font-black uppercase outline-none focus:border-foreground transition-all placeholder-muted/50 text-foreground"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-0 p-2 hover:scale-110 transition-transform disabled:opacity-30 text-foreground"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
