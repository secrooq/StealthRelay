## 2024-05-18 - [Hardcoded Backdoor Secret Removal]
**Vulnerability:** A hardcoded bypass secret `"stealth_dev_bypass_root_2026"` existed in the NextAuth `authorize` logic within `src/auth.ts`, allowing an attacker who discovered the secret to bypass 2FA authentication for any user.
**Learning:** Hardcoding fallback credentials or development bypasses in code creates a high-severity backdoor. This occurred because developers likely wanted an easy way to bypass 2FA during testing and left it in the production codebase.
**Prevention:** Never use static strings for security bypasses. Use environment variables (e.g., `process.env.ADMIN_BYPASS_SECRET`) and securely parse and require them. When they are not present, fail securely instead of falling back to a static backdoor string.
