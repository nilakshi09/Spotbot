# Spotbot — Fraud Score for Influencer Audiences

## The Problem

A five-star rating on an influencer's profile tells you the sponsored post looked polished and the brand felt heard. It tells you **nothing** about whether the 400,000 followers are real people.

Follower counts can be inflated overnight through third-party bot services for a few hundred dollars. Engagement — likes, comments, shares — can be purchased just as easily. The comments look superficially authentic but are either templated gibberish from bot farms or recycled phrases copied across hundreds of unrelated posts.

Agencies know this problem exists. They have **no fast way to verify authenticity** before the contract is signed. They rely on gut feel, manual spot-checks, or expensive enterprise platforms that take days and require a sales call to access. By then the budget is already committed.

---

## The Solution

Spotbot takes an **Instagram or YouTube handle** and runs it through a multi-signal fraud model. No onboarding, no sales call. You type a handle, you get a score.

### Fraud Detection Signals

| Signal | What It Measures |
|---|---|
| **Follower Growth Velocity** | Detects unnatural spikes — overnight jumps of tens of thousands of followers that don't correlate with content events |
| **Engagement Rate Benchmarking** | Compares engagement against verified accounts in the same niche and follower tier to surface statistical outliers |
| **Comment Sentiment Analysis** | Identifies bot-pattern language — templated phrases, emoji-only spam, and recycled comments appearing across unrelated posts |
| **Spike Detection** | Flags sudden discontinuities on the follower timeline that indicate bulk-purchase events |

### Output

- **Fraud Score** — a single, digestible number representing audience authenticity
- **Estimated Real Reach** — how many of those followers are likely real, engaged humans
- **Shareable Report** — designed to drop straight into a client deck or approval workflow

---

## How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌─────────────────┐
│  Enter Handle│────▶│  Pull Public Data │────▶│  Run Fraud Model│────▶│  Generate Report │
│  (IG / YT)   │     │  (API + Scraping) │     │  (Multi-Signal) │     │  (Score + PDF)   │
└──────────────┘     └──────────────────┘     └────────────────┘     └─────────────────┘
```

1. **Input** — Agency user enters an Instagram or YouTube handle
2. **Data Collection** — Spotbot pulls publicly available profile data: follower count history, engagement metrics, recent comments, posting cadence
3. **Analysis** — The multi-signal fraud model scores the account across all detection vectors
4. **Output** — A fraud score, real reach estimate, and exportable report are generated instantly

---

## Target Market

### Primary: Marketing & Talent Agencies

Agencies evaluate dozens to hundreds of influencers per campaign. They need a tool that:

- Runs in seconds, not days
- Requires no vendor onboarding or sales calls
- Produces output that can go directly into a client presentation
- Scales across their entire creator evaluation pipeline

### Why Agencies Pay

| Pain Point | Current Solution | Spotbot |
|---|---|---|
| Verifying follower authenticity | Gut feel + manual spot-checks | Automated multi-signal fraud score |
| Speed of evaluation | Days (enterprise platforms) | Seconds |
| Accessibility | Sales calls + onboarding | Self-serve, instant access |
| Client-facing output | Screenshots + spreadsheets | Branded shareable reports |

---

## Business Model

**B2B per-seat SaaS** sold to agencies who run it across every creator they evaluate before a deal is signed.

### Pricing Levers

- **Per-seat licensing** — each analyst or account manager gets a seat
- **Volume tiers** — number of scans per month scales with plan
- **Report customization** — white-label reports for enterprise clients

### Why Per-Seat Works

Agencies already budget for tools per head. The buying motion is familiar. The value proposition is clear: every seat pays for itself the first time it catches a fraudulent influencer before a five- or six-figure deal is signed.

---

## Competitive Differentiation

| | Enterprise Platforms | Manual Spot-Checks | **Spotbot** |
|---|---|---|---|
| Speed | Days | Hours | **Seconds** |
| Cost | $$$$ / year | Free (but slow) | **$$ / seat / month** |
| Onboarding | Sales call required | None | **None** |
| Accuracy | High | Low | **High** |
| Output format | Dashboard-only | Ad hoc | **Shareable reports** |
| Accessibility | Enterprise-only | Anyone | **Anyone** |

---

## Key Assumptions to Validate

1. **Data availability** — Public APIs and scraping can surface enough signal for reliable scoring (follower history, engagement data, comment text)
2. **Model accuracy** — Multi-signal approach produces fraud scores that agencies trust enough to base purchasing decisions on
3. **Agency willingness to pay** — The pain is acute enough that agencies will adopt a new per-seat tool vs. continuing with manual methods
4. **Self-serve motion** — Agencies will onboard without a sales call if the product delivers value on first use

---

## MVP Scope

The minimum viable product focuses on proving the core value loop:

- [ ] **Single handle input** — Instagram first, YouTube second
- [ ] **Fraud score generation** — Follower velocity + engagement benchmarking + comment analysis
- [ ] **Report output** — Clean, shareable PDF/web report with score breakdown
- [ ] **Self-serve signup** — Email + password, no sales call
- [ ] **Usage-based billing** — Stripe integration, per-scan or per-seat monthly plans

### What's NOT in MVP

- Multi-platform aggregate scoring
- Historical tracking / watchlists
- CRM integrations
- Team collaboration features
- API access for programmatic use

---

*Spotbot exists because the influencer economy runs on trust, and trust without verification is just hope.*
