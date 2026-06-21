# Stripe Setup Guide

## 1. Create Stripe Account
Go to https://dashboard.stripe.com and create an account.

## 2. Create Products and Prices

In Stripe Dashboard → Products → Add Product:

### Starter Plan
- Name: Spotbot Starter
- Price: $49.00 / month (recurring)
- Copy the price ID → set as STRIPE_STARTER_PRICE_ID

### Pro Plan  
- Name: Spotbot Pro
- Price: $149.00 / month (recurring)
- Copy the price ID → set as STRIPE_PRO_PRICE_ID

## 3. Configure Webhook

In Stripe Dashboard → Webhooks → Add Endpoint:
- URL: https://api.spotbot.io/api/billing/webhook
- Events to listen for:
  ✓ checkout.session.completed
  ✓ customer.subscription.updated
  ✓ customer.subscription.deleted
  ✓ invoice.payment_succeeded
  ✓ invoice.payment_failed

Copy the webhook signing secret → set as STRIPE_WEBHOOK_SECRET

## 4. Enable Customer Portal

In Stripe Dashboard → Settings → Billing → Customer Portal:
- Enable customer portal
- Allow customers to: cancel subscriptions, update payment methods, view invoices

## 5. Test Mode vs Live Mode

Development: use test mode keys (sk_test_..., whsec_...)
Production: switch to live mode keys (sk_live_..., whsec_...)

## 6. Local Webhook Testing

Install Stripe CLI:
  brew install stripe/stripe-cli/stripe-cli

Login:
  stripe login

Forward webhooks to local server:
  stripe listen --forward-to localhost:8000/api/billing/webhook

Use the CLI webhook secret (different from dashboard secret) for local dev.
