# ACM × NEAR.AI CTF — Competition Frontend Platform

Production frontend for the **6-hour Capture The Flag (CTF) cybersecurity competition** organized by the **ACM Student Chapter** in collaboration with **NEAR.AI**.

Designed and built with developer-tool craft: restrained typography, subtle borders, high-density data tables, dynamic countdown telemetry, and zero client-exposed server secrets.

---

## 🛡️ Competition Overview

- **Event**: ACM × NEAR.AI CTF (2026 Invitational)
- **Organizer**: ACM Student Chapter
- **Collaborator**: NEAR.AI
- **Duration**: 6 Hours
- **Challenge Architecture**:
  - **ACM Core Track (~75%)**: Web Exploitation, Cryptography, Digital Forensics, Reverse Engineering, Binary Exploitation (Pwn), OSINT.
  - **NEAR.AI Track (~25%)**: Autonomous Agent Guardrail Robustness, WebAssembly State Invariants, Attention Weight Steganography.

---

## 🎨 Human Design System & Tokens

Built to feel like an authentic university cybersecurity platform rather than an AI template or gaming dashboard:

- **Typography**:
  - Primary UI: **Inter** (clean, proportional, legible hierarchy)
  - Telemetry, Flags & Code: **JetBrains Mono** (flags, IP endpoints, memory hashes, countdown timers)
- **Palette**:
  - Dark foundation: `#090a0f` base with `#10121a` surfaces and `#232738` subtle 1px borders
  - Brand Primary: Deep Blue (`#2563eb`)
  - NEAR.AI Track: Crisp Cyan (`#06b6d4`)
  - Solved State: Restrained Emerald (`#10b981`)
  - Warnings & Urgency: Amber (`#f59e0b`) & Rose (`#f43f5e`)
- **Visual Restraint**:
  - Zero bloated neon glows, floating 3D spheres, or giant purple gradient cards.
  - High-density data tables with responsive grid switching.
  - Focus on solve speed, legibility, and rapid challenge triage.

---

## 🚀 Key Feature Highlights

### 1. Command Center Dashboard
- Live 6-hour dynamic countdown ticker with state reactivity.
- Real-time squad telemetry: Team score, current rank (`#4 / 32 Teams`), solve count (`5 / 14`), active members.
- Direct recommendation feed of unsolved challenges.

### 2. High-Precision Challenge Browser
- Instant search across title, author, and description.
- Multi-dimensional filters: Category, Difficulty, Points, Solved/Unsolved status, and Source Track (ACM vs NEAR.AI).
- Flexible **Grid view** and **Table view** layouts.

### 3. Challenge Workspace & Target Sandbox
- Sanitized Markdown rendering for technical briefings.
- Downloadable verified file artifacts with SHA-256 hashes and copy triggers.
- Target container manager: Dynamic spin-up/spin-down of Docker sandbox target endpoints.
- Progressive hints system with cost unlock confirmation.
- Focused flag submission box with strict `ACM{...}` validation and simulated rate-limiting (max 6 requests / 30s).

### 4. Live Leaderboard
- Real-time standings, solve count, and last solve timestamps.
- Subtle current team row highlighting.
- Clean SVG progression timeline chart tracking top contenders across the 6-hour window.

### 5. Team Headquarters
- Roster management (up to 4 operators per team).
- Point contribution breakdown per teammate.
- Direct invite token generator and clipboard copy.
- Chronological team solve feed.

### 6. Organizer Operations Desk (`/admin`)
- Role-based management view for competition organizers.
- Live telemetry: active teams, flag attempts, solve counts, track breakdown.
- Challenge inventory with live edit, create, and delete actions.
- Broadcast notification dispatcher with channel and priority selectors.

### 7. Organizer Lifecycle Simulator
- Accessible discreet header bar (`ORGANIZER SIMULATOR`) allowing instant previewing and testing across all 5 competition phases:
  1. `BEFORE_EVENT` (Countdown to kick-off, registration open)
  2. `LIVE` (6-hour active competition clock)
  3. `ENDING_SOON` (Final 15-minute alert banner)
  4. `FINISHED` (Submissions locked, frozen standings)
  5. `MAINTENANCE` (Infrastructure rebalancing status)
- Quick role switching between **Participant** and **Organizer (Admin)**.

---

## 🔒 Security Principles

- **Zero Secrets Client-Side**: No real server keys, admin passwords, or plaintext target flags exist in the frontend bundle.
- **Server-Side Simulation**: Flag validation and rate-limiting are processed via abstracted asynchronous service mock contracts with realistic latency.
- **Safe Input Sanitization**: Form inputs and flag submissions are normalized, trimmed, and protected against rapid double-clicks.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/         # Navbar, EventBanner, DemoToolbar, Footer
│   └── ui/             # Button, Badge, Input, Card, Modal, Toast, Skeleton, EmptyState
├── context/
│   ├── AuthContext.tsx # User session, team affiliation, role switching
│   ├── EventContext.tsx# 6-hour dynamic countdown and event status states
│   └── CTFContext.tsx  # Challenge state, instances, hints, solves
├── data/
│   └── mockData.ts     # 14 realistic challenges across 7 categories
├── lib/
│   └── utils.ts        # Design tokens, countdown math, points formatting
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ChallengesPage.tsx
│   ├── ChallengeDetailPage.tsx
│   ├── LeaderboardPage.tsx
│   ├── TeamPage.tsx
│   ├── AnnouncementsPage.tsx
│   ├── ProfilePage.tsx
│   ├── RulesPage.tsx
│   ├── AdminPage.tsx
│   └── NotFoundPage.tsx
├── services/           # Service abstraction layer (auth, challenge, leaderboard, team, event)
└── types/              # Strict TypeScript domain interfaces
```

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production TypeScript check & build
npm run build

# Preview production build locally
npm run preview
```
