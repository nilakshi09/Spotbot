# Uptime Monitoring Setup

## BetterStack (Recommended)

### Setup
1. Go to https://betterstack.com and create account
2. Go to Uptime → Monitors → New Monitor

### Monitors to Create

#### API Health Check
- URL: https://api.spotbot.io/api/health/live
- Check interval: 60 seconds
- Regions: US East, EU West, Asia Pacific
- Alert after: 2 consecutive failures
- Alert via: email + Slack (if configured)

#### API Ready Check
- URL: https://api.spotbot.io/api/health/ready
- Check interval: 2 minutes
- Alert after: 1 failure (readiness failure = DB or Redis down)

#### Frontend
- URL: https://spotbot.io
- Check interval: 60 seconds
- Expected status: 200
- Expected content: "Spotbot" (title check)

### Alert Escalation
- 1 failure:  email to on-call
- 3 failures: SMS to on-call
- 5 failures: page all team members

## Alternative: Better Uptime (free tier)
- https://betteruptime.com
- Free: 10 monitors, 3 min intervals

## Alternative: UptimeRobot (free tier)
- https://uptimerobot.com
- Free: 50 monitors, 5 min intervals

## Incident Response
When downtime is detected:
1. Check Railway dashboard for backend errors
2. Check Neon dashboard for DB issues
3. Check Upstash dashboard for Redis issues
4. Check Sentry for error spike
5. Check Vercel dashboard for frontend issues
