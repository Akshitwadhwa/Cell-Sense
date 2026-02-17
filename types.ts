
export interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw';
  execution_count: number | null;
  metadata: Record<string, any>;
  outputs: any[];
  source: string | string[];
}

export interface NotebookContent {
  cells: NotebookCell[];
  metadata: Record<string, any>;
  nbformat: number;
  nbformat_minor: number;
}

export interface AIExplanationResult {
  why: string;
  analogy: string;
  pitfalls: string[];
}

export interface AIExplanation extends AIExplanationResult {
  cellIndex: number;
  status: 'idle' | 'loading' | 'completed' | 'error';
}

export interface ProcessedCell extends NotebookCell {
  id: string;
  sourceText: string;
}
