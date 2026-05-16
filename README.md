# budgt;

A premium personal finance tracker built with React, Vite, and TailwindCSS.

## Features

- 📊 **Dashboard** — Balance overview, daily tracking streak, budget progress
- 💰 **Income & Expense Tracking** — Full transaction CRUD with category management
- 📈 **Analytics** — Interactive charts (donut, bar, area) with Recharts
- 🎯 **Budget Management** — Per-category spending limits with progress bars
- ⚙️ **Settings** — Profile, currency, notifications, theme toggle, CSV export
- 🌙 **Dark/Light Mode** — Premium dark-first design with smooth transitions

## Tech Stack

- **React 18** + **Vite 6** — Fast HMR and modern build tooling
- **TailwindCSS 4** — Utility-first styling with custom design tokens
- **Framer Motion** — Fluid animations and page transitions
- **Recharts** — Interactive data visualization
- **React Router 7** — Client-side routing with animated transitions
- **Lucide React** — Clean, consistent iconography

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
├── gemini.md              # Project Map (B.L.A.S.T.)
├── architecture/          # SOPs and integration plans
├── .tmp/                  # Temporary workbench
├── .env.example           # Environment variable template
└── src/
    ├── main.tsx           # Entry point
    ├── styles/            # Global styles and theme
    └── app/
        ├── routes.ts      # Route definitions
        ├── layout/        # App shell (sidebar, nav)
        ├── pages/         # Page components
        ├── components/    # Reusable components
        ├── context/       # State management
        └── lib/           # Shared utilities
```

## License

MIT
