// Production Infrastructure Constants
// These provide critical fallbacks if environment variables are not correctly injected at build time.

const rawSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const TURNSTILE_SITE_KEY = 
  (!rawSiteKey || rawSiteKey.startsWith("1x")) 
    ? "0x4AAAAAAADOfEkQcnejCX1Cd" 
    : rawSiteKey;

export const STRIPE_PUBLISHABLE_KEY = 
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  "pk_test_51TWXEx5kUnqpQn8pc0ooLL8wJmwhaYZ2WDEXMWV7hTtZVZJTwvzEM4KZgOpE3g4KBIxjgwgMbX6xeSEyl3r82EHG005K0Vn7uG";
