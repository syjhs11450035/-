import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, User, Bot, Loader2, Maximize2, Minimize2, X } from 'lucide-react';
import { cn, modes } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface AISidebarProps {
  context?: any;
  mode: string;
  onModeChange: (mode: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AISidebar({ context, mode, onModeChange, isOpen, onToggle }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, mode, context }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("非 JSON 回應:", text);
        throw new Error("伺服器返回了非 JSON 格式的回應。");
      }

      const data = await response.json();
      const aiMsg: Message = { role: 'assistant', content: data.text, id: (Date.now() + 1).toString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = { 
        role: 'assistant', 
        content: `抱歉，發生了錯誤：${error.message}。請確認您的 API 金鑰已設定且伺服器運作正常。`, 
        id: (Date.now() + 1).toString() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "fixed right-0 top-0 h-full bg-brand-sidebar border-l border-gray-800 shadow-2xl transition-all duration-300 z-50 flex flex-col",
      isOpen ? "w-[400px]" : "w-0 overflow-hidden border-none"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-brand-sidebar">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-400">AI 數學助手</span>
          <div className="flex items-center space-x-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest">引擎運作中</span>
          </div>
        </div>
        <button onClick={onToggle} className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-20">
            <Bot size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-sm font-medium uppercase tracking-widest">等待互動</p>
            <p className="text-xs text-gray-500 mt-2 px-10">你可以詢問關於步驟、性質分析或幾何意義的任何問題。</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            {msg.role === 'assistant' && (
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-indigo-500 rounded-sm flex items-center justify-center text-[10px] font-bold italic text-white">A</div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                  {modes.find(m => m.id === mode)?.name.replace('模式', '').replace('型', '')} 模式
                </span>
              </div>
            )}
            <div className={cn(
              "max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 rounded-tr-none shadow-lg shadow-indigo-900/10" 
                : "bg-gray-800/40 text-gray-300 border border-gray-700/50 rounded-tl-none shadow-md shadow-black/20"
            )}>
              <div className="markdown-body">
                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.content}
                </Markdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest pl-2">
            <Loader2 size={12} className="animate-spin" />
            分析中...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800 bg-brand-bg">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="詢問 AI 關於推導詳情..."
            className="w-full bg-brand-input border border-gray-800 rounded-xl p-4 pr-12 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 resize-none h-24 placeholder:text-gray-600 transition-all shadow-inner"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 p-2 text-indigo-500 hover:text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
