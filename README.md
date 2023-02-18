# 468-scalable-system

### Getting Started

Install pnpm, or just use npm, but pnpm is faster and more efficient. Will use less disk space.

```bash
npm install -g pnpm
```

### Working on a component

```bash
cd frontend # OR transaction-server OR webserver
pnpm install
pnpm run dev
```

### Pipelines

Pushes / Merges to main will be
 - Automatically Versioned (git tag)
 - Automatically tested (only transaction server for now, but can be added to if we add other tests)
 - Automatically built
 - Automatically pushed to dockerhub (for use later in a deployment)