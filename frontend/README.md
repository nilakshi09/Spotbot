# SpotBot — Frontend

Next.js landing page and web application for SpotBot.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **UI**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Space Grotesk, Inter, JetBrains Mono (via `next/font`)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx         # Root layout with fonts & metadata
│   ├── page.tsx           # Landing page (composes all sections)
│   ├── globals.css        # Global styles, theme tokens, animations
│   └── favicon.ico
│
├── components/
│   ├── layout/            # Persistent layout components
│   │   ├── Navbar.tsx     # Fixed top navigation
│   │   └── Footer.tsx     # Site footer
│   │
│   ├── sections/          # Landing page sections
│   │   ├── HeroSection.tsx
│   │   ├── TrustBar.tsx
│   │   ├── ProblemSection.tsx
│   │   ├── HowFraudModelWorks.tsx
│   │   ├── DemoSection.tsx
│   │   ├── ComparisonTable.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── EmotionalAnchor.tsx
│   │   ├── PricingSection.tsx
│   │   ├── FAQSection.tsx
│   │   └── FinalCTA.tsx
│   │
│   └── ui/                # Reusable UI primitives
│       └── (empty — ready for shared components)
│
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & data
│   └── mockScanData.ts   # Sample fraud report data
└── public/                # Static assets (SVGs, images)
```

## Component Overview

| Component | Description |
|---|---|
| **Navbar** | Fixed glassmorphism header with navigation links |
| **HeroSection** | Animated hero with floating data points and profile card |
| **TrustBar** | Social proof bar with agency statistics |
| **ProblemSection** | Problem statement with animated stat cards |
| **HowFraudModelWorks** | Four-signal fraud model explainer |
| **DemoSection** | Interactive fraud scan demo with live animation |
| **ComparisonTable** | SpotBot vs. alternatives feature matrix |
| **HowItWorksSection** | Three-step workflow explanation |
| **EmotionalAnchor** | Large typography emotional call-to-action |
| **PricingSection** | Pricing tiers with feature lists |
| **FAQSection** | Expandable FAQ accordion |
| **FinalCTA** | Email capture with ambient particle animation |
| **Footer** | Site footer with links and legal |

## Design System

The design uses a dark theme with the following tokens defined in `globals.css`:

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#0a0b0d` | Page background |
| `--color-foreground` | `#f0f4f8` | Primary text |
| `--color-surface` | `#0d1117` | Card backgrounds |
| `--color-cyan` | `#00d4c8` | Primary accent |
| `--color-danger` | `#ff4757` | Risk/fraud indicators |
| `--color-warning` | `#ffc107` | Medium risk indicators |
| `--color-muted` | `#8899aa` | Secondary text |
