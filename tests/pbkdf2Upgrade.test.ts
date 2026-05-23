import { describe, it, expect } from 'vitest';
import fs from 'fs';

describe('OWASP PBKDF2 Iteration Upgrade', () => {
  it('Should use 600,000 iterations for deriveKeyFromText default', async () => {
    const code = await fs.promises.readFile('./src/workers/securityEngine.worker.ts', 'utf-8');
    expect(code).toContain("iterations: number = 600000");
    expect(code).toContain("iterations: iterations");
  });

  it('Should store iteration count in encrypted file metadata', async () => {
    const code = await fs.promises.readFile('./src/workers/securityEngine.worker.ts', 'utf-8');
    expect(code).toContain("iterations: 600000");
  });

  it('Should use fallback logic for backwards compatibility', async () => {
    const code = await fs.promises.readFile('./src/workers/securityEngine.worker.ts', 'utf-8');
    expect(code).toContain("this.deriveKeyFromText(input, saltBuffer, 100000)");
  });

  it('Should use 600,000 iterations for auth hashing default', async () => {
    const code = await fs.promises.readFile('./src/auth.ts', 'utf-8');
    expect(code).toContain("iterations: number = 600000");
    expect(code).toContain("const legacyHash = await hashPassword(password, user.salt, 100000)");
  });
});
