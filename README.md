# School Demos

Two offline-ready classroom demos designed for live presentations to middle-school students (~age 13).

## Projects

### `coding-demo/` — 3D Solar System Live Coding Demo

An interactive 3D Solar System built with **Three.js**, **TypeScript**, and **Vite**. All tunable settings (`TIME_SPEED`, `SUN_SIZE`, `SUN_COLOR`, `PLANET_SCALE`, `PLANETS`, etc.) live at the top of `coding-demo/src/main.ts` and update live via Vite hot module replacement (HMR) without resetting the camera or orbits.

**Run it:**
```bash
cd coding-demo
bun install
bun run dev
```

**Controls:**
- **Drag** — rotate camera
- **Scroll** — zoom in / out
- **Click a planet** — glide in and follow it
- **Click empty space** — stop following
- **Space** — pause / resume
- **R** — reset camera view

See `coding-demo/NOTES.md` for the 15-minute speaker script and live-editing prompts.

---

### `ai-demo/` — How a Language Model Answers

An interactive, scene-by-scene animated presentation built with **React**, **Remotion**, and **Vite** that walks through how an AI chat model turns a prompt into an answer (tokenization using real GPT-4 token IDs, attention, and next-token prediction).

**Run it:**
```bash
cd ai-demo
bun install
bun run dev
```

**Controls:**
- **Right Arrow / Space / Page Down** — next scene
- **Left Arrow / Page Up** — previous scene
- **R** — replay current scene
- **F** — toggle fullscreen

**Other scripts:**
- `bun run tokenize` — regenerate token data (`scripts/tokenize.ts`)
- `bun run stills` — render still frames (`scripts/stills.ts`)

See `ai-demo/NOTES.md` for the ~10-minute speaker script.

## Prerequisites

- [Bun](https://bun.sh/) (both projects use `bun.lock` and run 100% offline once dependencies are installed)
