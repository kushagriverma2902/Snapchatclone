# SnapClone 👻

A mobile-first ephemeral photo and video messaging web application built with React 19, Vite, TypeScript, and Tailwind CSS.

## Features

- 📸 **Real-Time Camera & AR Lenses**: Live webcam support with interactive AR canvas filters, lighting modes, timer, and high-definition fallback simulations.
- 🎨 **Snap Editor**: Creative toolkit with text captions, drawing canvas with custom colors & brush sizes, emojis, stickers, and sound effects.
- ⏳ **Ephemeral Messaging**: 1-to-10 second disappearing photo/video snaps with replay detection, screenshot simulation alerts, and chat replies.
- 📖 **24-Hour Stories**: Rich story viewer with animated progress bars, tap-to-navigate, story creation, and viewer insights.
- 🔥 **Snap Streaks**: Real-time streak tracking with daily countdowns and streak reminders.
- 💬 **Direct Messaging**: Chat threads with typing indicators, bitmoji reactions, audio voice notes, and media sharing.
- 👤 **Profile & Snapcode**: Custom user profiles, editable avatars, bio, and shareable QR Snapcodes.

## Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `yarn` or `pnpm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Building for Production

To create an optimized production build in the `dist` folder:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Deployment

### Vercel / Netlify / Cloudflare Pages
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Node version: `18.x` or `20.x`

### GitHub Pages
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your `gh-pages` branch or configure GitHub Actions for static Vite deployment.
