
import React, { useRef, useEffect, useState } from 'react';
import { AIExplanation } from '../types';
import { Sparkles, Loader2, ArrowRight, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, Check, Terminal, FileText } from 'lucide-react';

interface ExplanationCardProps {
  explanation?: AIExplanation;
  isActive: boolean;
  id: string;
  onRetry?: (id: string) => void;
  cellType?: 'code' | 'markdown' | 'raw';
}

const ExplanationCard: React.FC<ExplanationCardProps> = ({ explanation, isActive, id, onRetry, cellType = 'code' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  const handleCopy = () => {
    if (!explanation || explanation.status !== 'completed') return;
    const text = `Why:\n${explanation.why}\n\nAnalogy:\n${explanation.analogy}\n\nPitfalls:\n${explanation.pitfalls.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!explanation || explanation.status === 'idle') {
    return (
      <div 
        ref={cardRef}
        id={`explanation-${id}`}
        className={`p-8 mb-8 border border-zinc-800 rounded-xl transition-all duration-700 flex flex-col items-center justify-center gap-4 ${isActive ? 'bg-[#1E1E1E] border-[#007AFF] opacity-100' : 'opacity-40'}`}
      >
        <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Node Standby</span>
      </div>
    );
  }

  if (explanation.status === 'loading') {
    return (
      <div 
        ref={cardRef}
        id={`explanation-${id}`}
        className={`p-8 mb-8 bg-[#007AFF] text-white rounded-xl transition-all duration-500 flex flex-col items-center justify-center gap-4 ${isActive ? 'scale-105 shadow-[0_0_30px_rgba(0,122,255,0.3)]' : ''}`}
      >
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synthesizing...</span>
        <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-white/60 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  if (explanation.status === 'error') {
    return (
      <div 
        ref={cardRef}
        id={`explanation-${id}`}
        className={`p-8 mb-8 border border-red-500/30 bg-red-950/20 rounded-xl transition-all duration-500 flex flex-col items-center justify-center gap-4 ${isActive ? 'opacity-100' : 'opacity-30'}`}
      >
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Synthesis Failed</span>
        <p className="text-[11px] text-zinc-500 text-center max-w-[200px]">Could not generate explanation for this cell.</p>
        {onRetry && (
          <button
            onClick={() => onRetry(id)}
            className="mt-2 flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition-all rounded active:scale-95"
          >
            <RefreshCw size={10} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={cardRef}
      id={`explanation-${id}`}
      className={`p-8 mb-8 transition-all duration-500 border-t-2 rounded-b-xl ${
        isActive 
          ? 'bg-[#1E1E1E] border-[#007AFF] shadow-[0_20px_50px_rgba(0,0,0,0.4)] opacity-100 scale-100' 
          : 'bg-[#1A1A1A] border-zinc-700/50 opacity-70 hover:opacity-90'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded ${cellType === 'code' ? 'bg-[#007AFF]' : 'bg-emerald-600'}`}>
            {cellType === 'code' ? <Terminal size={16} className="text-white" /> : <FileText size={16} className="text-white" />}
          </div>
          <div>
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[#E0E0E0]">Mentor Insight</h3>
            <span className={`text-[8px] font-bold uppercase tracking-widest ${cellType === 'code' ? 'text-[#007AFF]' : 'text-emerald-400'}`}>
              {cellType === 'code' ? 'Code Cell' : 'Markdown Cell'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-zinc-700/50 transition-colors text-zinc-500 hover:text-zinc-300"
            title="Copy explanation"
          >
            {copied ? <Check size={14} className="text-[#1DB954]" /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded hover:bg-zinc-700/50 transition-colors text-zinc-500 hover:text-zinc-300"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-8">
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 text-[#007AFF] mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest border-b border-[#007AFF] pb-1">Rationale</span>
            </div>
            <p className="text-[#E0E0E0] text-[13px] leading-[1.8] font-medium">{explanation.why}</p>
          </section>

          <section className="bg-[#181818] p-5 border-l-2 border-[#1DB954] rounded animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 text-[#1DB954] mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest italic">Conceptual Mapping</span>
            </div>
            <p className="text-[#D0D0D0] text-[13px] italic leading-relaxed">"{explanation.analogy}"</p>
          </section>

          {explanation.pitfalls.length > 0 && (
            <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 text-red-400 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest border-b border-red-400 pb-1">Risk Assessment</span>
              </div>
              <ul className="space-y-3">
                {explanation.pitfalls.map((pitfall, i) => (
                  <li key={i} className="text-[12px] text-[#D4D4D4] flex items-start gap-3">
                    <ArrowRight size={12} className="mt-1 shrink-0 text-[#007AFF]" />
                    <span className="font-medium">{pitfall}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplanationCard;
