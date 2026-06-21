<div align="center">

# 🤖 SpotBot

**Fraud detection for influencer marketing agencies.**

Know if the audience is real before you sign the deal.

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](./LICENSE)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)](./frontend)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CI](https://img.shields.io/github/actions/workflow/status/your-username/Spotbot2/ci.yml?label=CI&logo=github)](../../actions)

---

[Live Demo](#demo) · [How It Works](#architecture) · [Getting Started](#getting-started) · [Contributing](#contributing)

</div>

## The Problem

Influencer marketing agencies spend millions on creator partnerships — but up to **40% of influencer followers are fake**. Manual vetting takes days, enterprise tools cost $1,500+/month, and neither gives you a result before the contract is signed.

## The Solution

SpotBot scans any Instagram or YouTube handle in **under 60 seconds** and returns a multi-signal fraud score. No onboarding. No sales call. Just the truth.

### How It Works

| Signal | What It Detects |
|---|---|
| 📈 **Growth Velocity** | Sudden follower spikes from purchased followers |
| 📊 **Engagement Benchmark** | Abnormally low engagement vs. niche peers |
| 💬 **Comment Analysis** | Bot-pattern language in comment sections |
| ⚡ **Spike Detection** | Follower bursts uncorrelated with content |

## Architecture

```
Spotbot2/
├── frontend/           # Next.js landing page & web app
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   │   ├── layout/     # Navbar, Footer
│   │   ├── sections/   # Page sections (Hero, Demo, Pricing...)
│   │   └── ui/         # Reusable UI primitives
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities & mock data
│   └── public/         # Static assets
│
├── backend/            # API server (TypeScript scaffold)
│   └── src/            # Source code
│       ├── routes/     # API route handlers
│       └── config/     # Environment configuration
│
├── docs/               # Project documentation
└── .github/workflows/  # CI/CD pipelines
```

> See [docs/architecture.md](./docs/architecture.md) for a detailed architecture overview.

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### Backend

```bash
cd backend
npm install
npm run dev
```

> The backend is currently a scaffold. See [backend/README.md](./backend/README.md) for the development roadmap.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js, React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| **Backend** | Node.js, TypeScript (framework TBD) |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel (frontend), TBD (backend) |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with ☕ and a mission to make influencer marketing honest.**

</div>
