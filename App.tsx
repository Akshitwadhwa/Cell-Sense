
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, BookOpen, BrainCircuit, PlayCircle, Github, Info, AlertCircle, Plus } from 'lucide-react';
import { NotebookContent, ProcessedCell, AIExplanation } from './types';
import { explainCell } from './services/geminiService';
import NotebookCell from './components/NotebookCell';
import ExplanationCard from './components/ExplanationCard';

const CONCURRENCY_LIMIT = 3;

const App: React.FC = () => {
  const [notebook, setNotebook] = useState<NotebookContent | null>(null);
  const [processedCells, setProcessedCells] = useState<ProcessedCell[]>([]);
  const [explanations, setExplanations] = useState<Record<string, AIExplanation>>({});
  const [activeCellId, setActiveCellId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notebookContext, setNotebookContext] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string) as NotebookContent;
        const processed = content.cells.map((cell, idx) => ({
          ...cell,
          id: `cell-${idx}`,
          sourceText: Array.isArray(cell.source) ? cell.source.join('') : cell.source,
        }));
        
        setNotebook(content);
        setProcessedCells(processed);
        setExplanations({});
        setError(null);
        setNotebookContext(
          processed.filter(c => c.cell_type === 'markdown').slice(0, 3).map(c => c.sourceText).join(' ')
        );
        if (processed.length > 0) setActiveCellId(processed[0].id);
      } catch (err) {
        setError("Parse Error: Invalid .ipynb file structure.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const explainSingleCell = async (cell: ProcessedCell, context: string) => {
    setExplanations(prev => ({
      ...prev,
      [cell.id]: { ...prev[cell.id], status: 'loading' }
    }));

    try {
      const result = await explainCell(cell.sourceText, cell.cell_type, context);
      setExplanations(prev => ({
        ...prev,
        [cell.id]: { ...result, cellIndex: prev[cell.id].cellIndex, status: 'completed' }
      }));
    } catch (err) {
      setExplanations(prev => ({
        ...prev,
        [cell.id]: { ...prev[cell.id], status: 'error' }
      }));
    }
  };

  const startTutorSession = async () => {
    if (!processedCells.length) return;
    
    setIsProcessing(true);
    const initialExplanations: Record<string, AIExplanation> = {};
    
    processedCells.forEach((cell, idx) => {
      initialExplanations[cell.id] = {
        cellIndex: idx,
        why: '',
        analogy: '',
        pitfalls: [],
        status: 'idle'
      };
    });
    setExplanations(initialExplanations);

    const context = notebookContext;

    // Process all cells in parallel batches of CONCURRENCY_LIMIT
    for (let i = 0; i < processedCells.length; i += CONCURRENCY_LIMIT) {
      const batch = processedCells.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(batch.map(cell => explainSingleCell(cell, context)));
    }

    setIsProcessing(false);
  };

  const handleRetry = useCallback((cellId: string) => {
    const cell = processedCells.find(c => c.id === cellId);
    if (cell) {
      explainSingleCell(cell, notebookContext);
    }
  }, [processedCells, notebookContext]);

  // Keyboard navigation: arrow up/down to move between cells
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!processedCells.length) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      e.preventDefault();
      const currentIdx = processedCells.findIndex(c => c.id === activeCellId);
      if (currentIdx === -1) return;

      const nextIdx = e.key === 'ArrowDown'
        ? Math.min(currentIdx + 1, processedCells.length - 1)
        : Math.max(currentIdx - 1, 0);

      const nextCell = processedCells[nextIdx];
      setActiveCellId(nextCell.id);
      document.getElementById(nextCell.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [processedCells, activeCellId]);

  const onCellIntersect = useCallback((id: string) => {
    setActiveCellId(id);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#121212] selection:bg-[#007AFF] selection:text-white">
      {/* Header */}
      <header className="h-16 bg-[#1A1A1A] border-b border-[#2C2C2C] px-10 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="bg-[#007AFF] p-2 rounded-lg">
            <BrainCircuit className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#E0E0E0] tracking-tighter uppercase leading-none mb-1">AI Tutor</h1>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Neural Learning Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept=".ipynb" 
            onChange={handleFileUpload} 
            className="hidden" 
            ref={fileInputRef} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#E0E0E0] border border-zinc-700 hover:bg-[#2C2C2C] transition-all rounded"
          >
            <Upload size={12} />
            Import Notebook
          </button>
          
          {notebook && !isProcessing && (
            <button 
              onClick={startTutorSession}
              className="flex items-center gap-2 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-[#007AFF] hover:bg-[#0062CC] transition-all rounded shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <PlayCircle size={12} />
              Decrypt Logic
            </button>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex flex-1 overflow-hidden">
        {!notebook ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in bg-gradient-to-b from-[#121212] to-[#0A0A0A]">
            <div className="mb-12 relative group">
               <div className="w-24 h-24 bg-[#1E1E1E] border border-[#2C2C2C] rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                <BookOpen className="text-[#007AFF]" size={40} strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#007AFF] p-2 rounded-lg text-white shadow-lg">
                <Plus size={14} strokeWidth={3} />
              </div>
            </div>
            
            <h2 className="text-3xl font-black text-[#E0E0E0] mb-6 tracking-tighter uppercase">Machine Learning Oracle</h2>
            <p className="text-zinc-500 mb-10 max-w-md mx-auto leading-relaxed text-sm font-medium">
              A pedagogical engine for Jupyter research. Upload your workspace to generate high-fidelity mentor insights, risk assessments, and conceptual bridges.
            </p>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="group flex items-center gap-3 px-10 py-4 bg-[#007AFF] text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-[#0062CC] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              Initialize Node
            </button>
          </div>
        ) : (
          <div className="flex w-full h-full relative">
            {/* Left side: Notebook */}
            <div className="flex-1 overflow-y-auto px-12 py-16 scroll-smooth">
              <div className="max-w-3xl mx-auto">
                <div className="mb-16">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-2 block">Environment Log</span>
                  <h2 className="text-4xl font-black text-[#E0E0E0] tracking-tighter uppercase mb-4 leading-none">
                    {notebook.metadata?.kernelspec?.display_name || 'Active Session'}
                  </h2>
                  <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#1DB954] rounded-full shadow-[0_0_10px_rgba(29,185,84,0.5)]"></div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{notebook.metadata?.language_info?.name || 'Python'} Ready</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{processedCells.length} Computational Units</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-10 p-5 bg-red-900/20 border border-red-500/30 text-red-400 flex items-center gap-4 rounded-xl">
                    <AlertCircle size={18} strokeWidth={3} />
                    <span className="text-[11px] font-black uppercase tracking-widest">{error}</span>
                  </div>
                )}

                <div className="space-y-2 pb-[40vh]">
                  {processedCells.map((cell) => (
                    <NotebookCell 
                      key={cell.id} 
                      cell={cell} 
                      isActive={activeCellId === cell.id}
                      onIntersect={onCellIntersect}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: AI Explanations */}
            <div className="w-[440px] bg-[#1A1A1A] overflow-y-auto relative border-l border-[#2C2C2C]">
              <div className="sticky top-0 z-20 bg-[#1A1A1A]/90 backdrop-blur-xl px-10 py-5 border-b border-[#2C2C2C] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full"></div>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em] text-[#E0E0E0]">Heuristic Stream</span>
                </div>
                {isProcessing && (
                   <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#007AFF] rounded-full animate-ping"></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Live Synthesis</span>
                  </div>
                )}
              </div>
              
              <div className="p-8 pb-64">
                {processedCells.length === 0 ? (
                  <div className="text-center py-40 opacity-10">
                    <Info size={40} strokeWidth={1} className="mx-auto mb-6 text-[#E0E0E0]" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#E0E0E0]">No Cells Found</p>
                  </div>
                ) : (
                  processedCells.map((cell) => (
                    <ExplanationCard 
                      key={`exp-${cell.id}`}
                      id={cell.id}
                      explanation={explanations[cell.id]}
                      isActive={activeCellId === cell.id}
                      onRetry={handleRetry}
                      cellType={cell.cell_type}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Status Bar */}
      {notebook && (
        <footer className="h-10 bg-[#1A1A1A] px-10 border-t border-[#2C2C2C] flex items-center justify-between text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] flex-shrink-0">
          <div className="flex gap-8">
            <span className="hover:text-zinc-400 transition-colors">Protocol V{notebook.nbformat}.{notebook.nbformat_minor}</span>
            <span className="hover:text-zinc-400 transition-colors">Kernel: {notebook.metadata?.kernelspec?.name || 'GENERIC'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={isProcessing ? 'text-[#007AFF] animate-pulse' : 'text-[#1DB954]'}>
              {isProcessing ? 'Neural Link Active' : 'System Secure'}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-[#007AFF] animate-pulse' : 'bg-[#1DB954]'}`}></div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
