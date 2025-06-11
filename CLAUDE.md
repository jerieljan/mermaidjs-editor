# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compiler then Vite build)
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build locally

## Architecture

This is a React + TypeScript + Vite application that provides a Mermaid diagram editor with live preview.

**Core Components:**
- `App.tsx` - Main application with split-pane editor/preview layout
- `MermaidPreview.tsx` - Handles Mermaid diagram rendering with error handling and cleanup

**Key Dependencies:**
- `@monaco-editor/react` - Code editor (Monaco Editor)
- `mermaid` - Diagram rendering library

**Architecture Notes:**
- Uses Monaco Editor configured for markdown syntax highlighting
- MermaidPreview component maintains last valid SVG state during syntax errors
- Implements cleanup logic to remove Mermaid error DOM elements that persist after failed renders
- Error boundary pattern: shows error messages while preserving last valid diagram