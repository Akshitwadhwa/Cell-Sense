
import React from 'react';
import { ProcessedCell } from '../types';
import { Terminal, FileText, ChevronRight } from 'lucide-react';

interface NotebookCellProps {
  cell: ProcessedCell;
  isActive: boolean;
  onIntersect: (id: string) => void;
}

const NotebookCell: React.FC<NotebookCellProps> = ({ cell, isActive, onIntersect }) => {
  const cellRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect(cell.id);
        }
      },
      { threshold: 0.6 }
    );

    if (cellRef.current) {
      observer.observe(cellRef.current);
    }

    return () => observer.disconnect();
  }, [cell.id, onIntersect]);

  return (
    <div 
      ref={cellRef}
      id={cell.id}
      onClick={() => onIntersect(cell.id)}
      className={`mb-8 p-6 transition-all duration-500 border-l-2 rounded-r-lg cursor-pointer ${
        isActive 
          ? 'border-[#007AFF] bg-[#1E1E1E] active-cell-shadow translate-x-1' 
          : 'border-transparent bg-transparent opacity-40 hover:opacity-100'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em]">
          {cell.cell_type === 'code' ? (
            <>
              <div className="bg-[#007AFF] text-white p-1 rounded-sm">
                <Terminal size={12} strokeWidth={3} />
              </div>
              <span className="text-[#E0E0E0]">Input [{cell.execution_count || ' '}]</span>
            </>
          ) : (
            <>
              <div className="border border-zinc-500 text-zinc-400 p-1 rounded-sm">
                <FileText size={12} strokeWidth={3} />
              </div>
              <span className="text-zinc-400">Markdown</span>
            </>
          )}
        </div>
        {isActive && <ChevronRight size={16} className="text-[#007AFF] animate-pulse" />}
      </div>

      <div className={`whitespace-pre-wrap text-[13px] leading-relaxed p-0 ${
        cell.cell_type === 'code' ? '' : 'text-zinc-300 font-sans text-base'
      }`}>
        {cell.cell_type === 'code' ? (
          <div className="flex code-font">
            <div className="select-none pr-4 text-right text-zinc-600 text-[12px] leading-relaxed border-r border-zinc-800 mr-4" aria-hidden="true">
              {cell.sourceText.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className="flex-1 text-[#00FF7F] overflow-x-auto">{cell.sourceText}</div>
          </div>
        ) : (
          cell.sourceText
        )}
      </div>

      {cell.outputs && cell.outputs.length > 0 && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Stdout / Result</span>
          <div className="text-[12px] text-zinc-400 font-mono overflow-x-auto max-h-60 overflow-y-auto bg-[#0A0A0A] p-4 border border-zinc-800 rounded">
            {cell.outputs.map((out, i) => (
              <div key={i} className="mb-1">
                {out.text || out.data?.['text/plain'] || (out.data ? JSON.stringify(out.data) : '')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotebookCell;
