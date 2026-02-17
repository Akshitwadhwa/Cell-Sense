# Jupyter AI Tutor

An interactive React app that helps learners understand Jupyter notebooks cell by cell.

## Status

`In Development`

## What It Does

- Imports `.ipynb` notebook files
- Displays notebook cells with a focused reading interface
- Uses Gemini to generate AI explanations for each cell
- Explains:
  - Why the cell matters
  - A real-world analogy
  - Common pitfalls to avoid
- Supports retry on failed explanation generation

## Tech Stack

- React + TypeScript
- Vite
- Gemini API (`@google/genai`)
- Lucide icons

## Getting Started

### Prerequisites

- Node.js 18+
- A Gemini API key

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your API key in `.env.local`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Run locally in development mode
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

## Notes

- This project currently targets notebook explanation workflows and is still being refined.
- UI, prompt quality, and error handling are actively improving.
