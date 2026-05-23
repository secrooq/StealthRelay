import Stripe from "stripe";
import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

export function getStripeSecretKey(): string {
  try {
    const ctx = getOptionalRequestContext();
    const envVal = (ctx?.env as any)?.STRIPE_SECRET_KEY;
    if (envVal) {
      return String(envVal).trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // Not in Cloudflare Pages runtime context
  }
  return (
    process.env.STRIPE_SECRET_KEY ||
    "sk_test_51TWXEx5kUnqpQn8pqvcu8tS6us4mIjxtrC7XAVcxxZKIAm7WKY7XJZbpufN1g0obEkVnRodqvtMJFoMsJG4VS78y00tgc3C6re"
  ).trim().replace(/^["']|["']$/g, '');
}

export function getStripeWebhookSecret(): string {
  try {
    const ctx = getOptionalRequestContext();
    const envVal = (ctx?.env as any)?.STRIPE_WEBHOOK_SECRET;
    if (envVal) {
      return String(envVal).trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // Not in Cloudflare Pages runtime context
  }
  return (process.env.STRIPE_WEBHOOK_SECRET || "").trim().replace(/^["']|["']$/g, '');
}

export function initStripe(): Stripe {
  const secret = getStripeSecretKey();
  return new Stripe(secret, {
    httpClient: Stripe.createFetchHttpClient(), // REQUIRED FOR EDGE RUNTIME (Cloudflare Pages)
  });
}
