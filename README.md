# Mythos TCG Arena Counter

**Live app: <https://tomjn.github.io/mythos/>**

A two-player match counter for the Mythos trading card game, built for a phone
laid flat between both players. The board renders right-side-up from both seats
(the top panel is mirrored), and everything you need to track during a game lives
on one screen.

## Features

- **Per-player chess clocks** — tap your half of the screen to end your turn and
  start the opponent's clock. Minimum 15 minutes per player.
- **Shared round timer** — an optional mode that replaces the chess clocks with a
  single countdown shared by both players (default 25 minutes).
- **Chakra and Mission counters** — per-player tallies with quick adjust and reset
  (chakra resets to the game base of 5).
- **Edge marker** — track which player currently holds the edge.
- **Pause / resume and timeout** handling.
- **Persistent state** — the current match is saved to `localStorage`, so a
  refresh or accidental close won't lose the game.
- **Screen stays awake** while a clock is running, via the Wake Lock API.
- **Installable PWA** — add it to your home screen for a full-screen, app-like
  experience.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

## Scripts

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start the Vite dev server with HMR           |
| `npm run build`    | Type-check (`tsc -b`) and build for production |
| `npm run preview`  | Preview the production build locally         |
| `npm run lint`     | Run ESLint                                   |
| `npm test`         | Run the test suite once (Vitest)             |
| `npm run test:watch` | Run tests in watch mode                    |

## Deployment

The app is hosted on GitHub Pages at <https://tomjn.github.io/mythos/>. A GitHub
Actions workflow (`.github/workflows/deploy.yml`) runs the test suite, builds the
site, and publishes it automatically on every push to `main`. The build uses
relative asset paths (`base: './'`) and hash-based routing, so the same output
also works when embedded at a sub-path elsewhere.

## Tech stack

- **React 19** + **TypeScript**, bundled with **Vite**
- **React Router** (HashRouter) for the match and settings screens
- **Tailwind CSS** with **shadcn/ui** components built on **Radix UI**
- **Vitest** + **Testing Library** for unit and component tests

## Project structure

```
src/
  match/        Match state: types, reducer, timing, storage, formatting
  screens/      MatchScreen and SettingsScreen
  components/   PlayerPanel, CenterBand, clock/stat tiles, ui/ primitives
  hooks/        useWakeLock
```

Match state is held in a reducer (`src/match/reducer.ts`) and shared through
`MatchContext`. Clocks store remaining time relative to when they last started,
so live values are derived on each tick rather than mutated — this keeps timers
accurate across re-renders and `localStorage` restores.
