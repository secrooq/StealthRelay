import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';

describe('Security Engine Audits', () => {
  it('Should fail completely on EXIF scrub failure to prevent data leak', async () => {
    const code = await fs.promises.readFile('./src/workers/securityEngine.worker.ts', 'utf-8');
    expect(code).toContain('throw new Error("EXIF_BLEACH_FAILED: Refusing to share payload to maintain zero-knowledge guarantee.");');
    expect(code).not.toContain('Reverting to original payload to maintain reliability.');
  });
});

  it('Verifies IV length is correctly instantiated everywhere', async () => {
    const code = await fs.promises.readFile('./src/workers/securityEngine.worker.ts', 'utf-8');
    const matches = code.match(/crypto\.getRandomValues\(new Uint8Array\(\d+\)\)/g);
    expect(matches).toBeDefined();

    // Most IVs for GCM should be 12 bytes
    matches!.forEach(match => {
      // 16 for salt/entropy, 12 for IVs
      expect(match.includes('16') || match.includes('12')).toBe(true);
    });
  });
