# Mermaid Diagram Editor

A live Mermaid diagram editor with real-time preview, built with React, TypeScript, and Vite.

## Features

- **Live Preview**: See your Mermaid diagrams rendered in real-time as you type
- **Monaco Editor**: Professional code editor with syntax highlighting and Berkeley Mono font
- **Error Handling**: Shows error messages while preserving the last valid diagram
- **Zoom Controls**: Zoom in, zoom out, and reset controls for diagram preview
- **Collapsible Editor**: Hide/show editor for full-screen preview mode
- **Split-Pane Layout**: Resizable editor and preview panes

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

### Building

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Linting

Run ESLint checks:
```bash
npm run lint
```

## Architecture

- **React + TypeScript + Vite**: Modern development stack
- **Monaco Editor**: Code editor with markdown syntax highlighting
- **Mermaid**: Diagram rendering library
- **Split-pane layout**: Editor on left, live preview on right
- **Persistent state**: Zoom level maintained across renders

## Key Components

- `App.tsx`: Main application with split-pane layout and editor toggle
- `MermaidPreview.tsx`: Handles diagram rendering, error handling, and zoom controls

## Contributing

Feel free to contribute changes using GitHub's pull requests. In typical fashion:

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
