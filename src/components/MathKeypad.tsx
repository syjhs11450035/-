import React from 'react';
import { Delete, Trash2, Send } from 'lucide-react';
import { cn } from '../lib/utils';

export type TabType = 'algebra' | 'trig' | 'calculus';

interface MathKeypadProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onInsert: (value: string) => void;
  onAction: (action: 'ac' | 'delete' | 'submit') => void;
}

const buttons: Record<TabType, string[][]> = {
  algebra: [
    ['x□', '√□', '<', '(', ')', 'delete', 'ac'],
    ['□/□', '|□|', '≤', '7', '8', '9', '÷'],
    ['log□', '□!', '>', '4', '5', '6', '×'],
    ['i', '%', '≥', '1', '2', '3', '-'],
    ['x', 'y', '=', '0', '.', '+', 'submit'],
  ],
  trig: [
    ['sin', 'cos', 'tan', '(', ')', 'delete', 'ac'],
    ['csc', 'sec', 'cot', '7', '8', '9', '÷'],
    ['arcsin', 'arccos', 'arctan', '4', '5', '6', '×'],
    ['□²', '□°', 'π', '1', '2', '3', '-'],
    ['x', 'y', '=', '0', '.', '+', 'submit'],
  ],
  calculus: [
    ['d/d□', '∞', '√□', '(', ')', 'delete', 'ac'],
    ['lim□→a', 'lim□→a⁺', 'lim□→a⁻', '7', '8', '9', '÷'],
    ['log□', 'C(n,k)', 'P(n,k)', '4', '5', '6', '×'],
    ['∑', '∫', '∫ᵇₐ', '1', '2', '3', '-'],
    ['x', 'y', 'e', '0', '.', '+', 'submit'],
  ],
};

const sendColors: Record<TabType, string> = {
  algebra: 'bg-violet-300 text-violet-900 hover:bg-violet-400',
  trig: 'bg-emerald-300 text-emerald-900 hover:bg-emerald-400',
  calculus: 'bg-rose-300 text-rose-900 hover:bg-rose-400',
};

export default function MathKeypad({ activeTab, onTabChange, onInsert, onAction }: MathKeypadProps) {
  const renderButton = (btn: string) => {
    if (btn === 'delete') {
      return (
        <button key={btn} onClick={() => onAction('delete')} className="flex-1 min-h-[48px] bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors">
          <Delete size={18} />
        </button>
      );
    }
    if (btn === 'ac') {
      return (
        <button key={btn} onClick={() => onAction('ac')} className="flex-1 min-h-[48px] bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center font-bold text-xs transition-colors">
          AC
        </button>
      );
    }
    if (btn === 'submit') {
      return (
        <button key={btn} onClick={() => onAction('submit')} className={cn("w-full h-12 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-lg", sendColors[activeTab])}>
          <Send size={18} />
        </button>
      );
    }

    const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
    const isNumber = /^\d$/.test(btn) || btn === '.';

    return (
      <button
        key={btn}
        onClick={() => onInsert(btn)}
        className={cn(
          "w-full h-12 rounded-xl flex items-center justify-center font-medium transition-colors text-sm",
          isOperator ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700" : 
          isNumber ? "bg-zinc-700/50 text-white hover:bg-zinc-600" :
          "bg-zinc-800/40 text-gray-400 hover:bg-zinc-700"
        )}
      >
        <span dangerouslySetInnerHTML={{ __html: btn.replace('□', '') }} />
      </button>
    );
  };

  return (
    <div className="w-full bg-[#111114] p-4 rounded-3xl border border-gray-800 shadow-2xl">
      {/* Tab Switcher */}
      <div className="flex gap-8 mb-4 px-2">
        {(['algebra', 'trig', 'calculus'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "text-xs font-bold pb-2 transition-all border-b-2 tracking-widest",
              activeTab === tab ? "border-indigo-500 text-gray-100" : "border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            {tab === 'algebra' ? '代數學' : tab === 'trig' ? '三角學' : '微積分'}
          </button>
        ))}
      </div>

      {/* Strict Table Layout */}
      <table className="w-full border-separate border-spacing-2">
        <tbody>
          {buttons[activeTab].map((row, i) => (
            <tr key={i}>
              {row.map((btn, j) => (
                <td key={`${i}-${j}`} className="p-0">
                  {renderButton(btn)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
