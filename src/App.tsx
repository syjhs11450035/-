import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, History, Maximize2, Minimize2, ChevronRight, Calculator, Activity, HelpCircle, User, Bot, Menu, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, modes } from './lib/utils';
import AISidebar from './components/AISidebar';
import MathPlot from './components/MathPlot';
import MathKeypad, { TabType } from './components/MathKeypad';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathResult {
  answer: string;
  latex: string;
  steps: string[];
  type: 'expression' | 'equation';
  plotData?: any[];
  analysis?: string;
}

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<MathResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiMode, setAiMode] = useState('hybrid');
  const [isComputing, setIsComputing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('algebra');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInsert = (value: string) => {
    // 簡單的插入邏輯，實務上可根據光標位置插入
    setInput(prev => prev + value.replace('□', ''));
    inputRef.current?.focus();
  };

  const handleAction = (action: 'ac' | 'delete' | 'submit') => {
    if (action === 'ac') setInput('');
    if (action === 'delete') setInput(prev => prev.slice(0, -1));
    if (action === 'submit') handleCompute();
  };

  const handleCompute = async () => {
    if (!input.trim()) return;
    setIsComputing(true);
    
    // 標準化輸入格式
    const normalizedInput = input
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '^')
      .replace(/π/g, 'PI')
      .replace(/e/g, 'E')
      .replace(/√/g, 'sqrt')
      .replace(/log/g, 'log10');

    try {
      const { all, create } = await import('mathjs');
      const math = create(all);
      let resultData: MathResult;
      
      // 1. 本地數學引擎處理
      let localAnswer = "";
      let localTex = "";
      let isEvaluationSuccessful = false;
      
      try {
        if (!normalizedInput.includes('=')) {
          const evaluated = math.evaluate(normalizedInput);
          localAnswer = evaluated.toString();
          localTex = math.parse(normalizedInput).toTex();
          isEvaluationSuccessful = true;
        } else {
          localAnswer = input;
          localTex = input;
        }
      } catch (e) {
        localAnswer = "解析中...";
      }

      // 2. 調用 AI 獲取推導 (處理金鑰缺失)
      let aiText = "";
      try {
        const aiResponse = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: input, 
            mode: aiMode, 
            context: { type: 'computation', input, localAnswer } 
          }),
        });
        
        const aiData = await aiResponse.json();
        if ((aiResponse.status === 401 || aiResponse.status === 500) && aiData.error?.includes('GEMINI_API_KEY')) {
          aiText = "### ⚠️ 需要設定 API 金鑰\n\n偵測到尚未設定 `GEMINI_API_KEY`。請在 AI Studio 的 **Settings -> Secrets** 面板中新增金鑰以啟用高級 AI 解析功能。\n\n目前本地運算結果：`" + localAnswer + "`";
        } else {
          aiText = aiData.text || "無法獲取 AI 解析。";
        }
      } catch (err) {
        aiText = "### 聯網解析失敗\n\n無法連接至 AI 伺服器。請檢查網路連線或金鑰設定。";
      }

      // 3. 處理圖形數據
      let plotData: any[] | undefined = undefined;
      const xVar = normalizedInput.includes('x');

      if (xVar) {
        try {
          const expr = normalizedInput.includes('=') ? `(${normalizedInput.split('=')[0]}) - (${normalizedInput.split('=')[1]})` : normalizedInput;
          const compiled = math.compile(expr);
          const xValues = Array.from({ length: 200 }, (_, i) => -10 + i * 0.1);
          const yValues = xValues.map(x => {
            try { 
              const val = compiled.evaluate({ x });
              return (typeof val === 'number' && !isNaN(val)) ? val : null;
            } catch { return null; }
          });
          
          plotData = [{
            type: 'scatter',
            mode: 'lines',
            x: xValues,
            y: yValues,
            line: { color: '#8b5cf6', width: 2.5, shape: 'spline' },
            name: `f(x) = ${input}`
          }];
        } catch (e) {
          console.warn("Plotting failed:", e);
        }
      }

      resultData = {
        answer: localAnswer,
        latex: localTex,
        type: input.includes('=') ? 'equation' : 'expression',
        steps: aiText.split('\n').filter(line => line.trim()),
        plotData,
        analysis: aiText
      };
      
      setResult(resultData);
    } catch (error: any) {
      console.error("Computation Error:", error);
      setResult({
        answer: "運算發生錯誤",
        latex: "Error",
        type: 'expression',
        steps: ["請檢查輸入語法", "伺服器連結可能不穩定"],
        analysis: `錯誤：${error.message}`
      });
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="h-screen bg-brand-bg text-gray-200 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-brand-surface shrink-0">
        <div className="flex items-center space-x-6">
          <div className="text-gray-100 font-bold text-xl tracking-tighter">
            數學解題工具
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Solver UI */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-gray-800 bg-[#16161A]/30">
          <div className="p-6 space-y-6 max-w-3xl mx-auto w-full overflow-y-auto">
            
            {/* Input Area */}
            <div className="relative">
              <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCompute()}
                  placeholder="輸入算式..."
                  className="w-full bg-transparent text-2xl font-mono text-gray-100 focus:outline-none placeholder:text-gray-700 h-12"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button className="text-gray-600 hover:text-gray-400"><ChevronDown size={24} /></button>
                </div>
              </div>
            </div>

            {/* Scientific Keypad */}
            <MathKeypad 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onInsert={handleInsert}
              onAction={handleAction}
            />

            {/* Quick Templates (From Image) */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { label: '線性方程式', exp: '6x + 5 = 14' },
                { label: '多項式', exp: '(x + 5)(x + 2)' },
                { label: '二次方程式', exp: '4x^2 - 5x - 12 = 0' }
              ].map((tmpl) => (
                <button
                  key={tmpl.label}
                  onClick={() => setInput(tmpl.exp)}
                  className="bg-zinc-800/20 border border-gray-800 rounded-full py-6 px-4 hover:bg-zinc-800/40 transition-all text-left group"
                >
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">{tmpl.label}</div>
                  <div className="text-lg font-serif text-gray-200 group-hover:text-indigo-400 transition-colors">{tmpl.exp}</div>
                </button>
              ))}
            </div>
            
            {/* Bottom Controls */}
            <div className="flex justify-end pr-4">
               <button className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 text-gray-400"><ChevronDown size={24} /></button>
            </div>
          </div>
        </section>

        {/* Right Side: AI & Visualization Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-[450px] bg-brand-sidebar border-l border-gray-800 flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-indigo-400 flex items-center gap-2">
                  <Activity size={18} /> 計算結果
                </h3>
                <button onClick={() => setResult(null)} className="text-gray-500 hover:text-white">回編輯</button>
              </div>

              <div className="bg-black/40 rounded-2xl p-6 border border-gray-800 mb-6">
                 <div className="text-[10px] text-gray-500 uppercase mb-2 font-bold select-none">渲染圖形</div>
                 <div className="h-64 flex items-center justify-center">
                    {result.plotData ? <MathPlot data={result.plotData} /> : <div className="text-xl italic font-serif">{result.answer}</div>}
                 </div>
              </div>

              <div className="space-y-4">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">詳細解析</div>
                <div className="bg-gray-800/20 p-6 rounded-2xl border border-gray-800 prose prose-invert max-w-none prose-sm">
                  <Markdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {result.analysis}
                  </Markdown>
                </div>
              </div>

              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="mt-8 w-full py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/20 transition-all font-bold flex items-center justify-center gap-2"
              >
                <Bot size={20} /> 與 AI 討論解法
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sidebar Component */}
      <AISidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        mode={aiMode}
        onModeChange={setAiMode}
        context={result}
      />
    </div>
  );
}
