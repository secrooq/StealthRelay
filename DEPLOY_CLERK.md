# StealthRelay Enterprise Security & Auth Strategy

This reference serves as the blueprint for production hardening, handling Clerk auth deployments, and implementing crucial regulatory frameworks (GDPR/CCPA).

---

## 1. Production Hardening for Clerk

### A. Required Environment Variables
Ensure the following variable cluster is propagated into Cloudflare Pages/Workers dashboard upon deployment:

```bash
# Core Identity Keying
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Landing / Routing Coordinates
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/relay
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/relay
```

### B. Cloudflare Pages Node Compatibility
Since Next.js on Cloudflare utilizes standard Node or Edge layers, Clerk's Next.js SDK seamlessly communicates with identity servers. Ensure `src/middleware.ts` does not process heavyweight dependencies to maintain sub-10ms initial request routing times.

### C. Syncing Webhooks via Svix
To synchronize Clerk account events (such as `user.created`, `user.deleted`, or email additions) with our D1 Database backend:
1. Navigate to Clerk Dashboard -> Webhooks.
2. Enable `user.created` and `user.deleted`.
3. Register endpoint: `https://stealthrelay.yourdomain.com/api/webhooks/clerk`.
4. Copy `WEBHOOK_SECRET` to your project secrets (`npx wrangler pages secret put CLERK_WEBHOOK_SECRET`).

---

## 2. Legal Notices & Compliance Overlay

As a private cryptographic relay vector, user tracking and log retention must be minimized. Implement a dedicated `/legal` cluster containing:

### A. GDPR Disclosures
1. **Data Minimization:** Clearly express that aliases act as a zero-knowledge layer. Incoming mail bodies are not saved to disk except as ephemeral stream caches.
2. **Right to Erasure:** Clicking "Burn Permanently" on an alias triggers a synchronous database `DELETE` cascade, followed by a vector wipe from Cloudflare Mail routing tables.

### B. CCPA Framework
1. Include a transparent footer node: "Do Not Sell or Share My Personal Information."
2. Note that user metadata (login history) is hosted strictly via ISO-27001-compliant Clerk data-hubs.

---

## 3. Zero-Trust Verification Audit
To guarantee operational secrecy, conduct quarterly verification of:
- **Web Worker Isolation:** Verify browser `securityEngine.worker.ts` does not retain decrypted keys in its window object or store them globally.
- **Subresource Integrity (SRI):** Hard-encode SRI hashes on dynamically retrieved script bundles to deter injection attacks.
