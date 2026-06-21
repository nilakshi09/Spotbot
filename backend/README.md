# SpotBot — Backend

API server for SpotBot's fraud detection engine.

## Status

🚧 **Under Development** — This is a scaffold for the upcoming backend.

## Planned Features

| Feature | Description |
|---|---|
| **Fraud Score API** | Compute multi-signal fraud scores for social media handles |
| **Data Ingestion** | Pull follower timelines, engagement data, and comment feeds |
| **Report Generation** | Generate PDF reports with fraud analysis results |
| **Authentication** | User accounts, API keys, and session management |
| **Billing** | Stripe integration for pay-per-scan and subscription plans |

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Build**: `tsc` + `tsx` for development

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts        # Entry point
│   ├── routes/         # API route handlers
│   └── config/         # Environment & app configuration
├── package.json
├── tsconfig.json
└── .gitignore
```

## Environment Variables

Create a `.env` file based on `.env.example` (when available):

```bash
PORT=8000
```
