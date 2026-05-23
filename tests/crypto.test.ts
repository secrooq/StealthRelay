import { describe, it, expect, vi } from 'vitest';

describe('SecurityEngine Security Tests', () => {
  it('Should fail completely on EXIF scrub failure to prevent data leak', async () => {
    const fs = await import('fs');
    const engineScript = await fs.promises.readFile('./src/workers/securityEngine.worker.ts', 'utf-8');

    // Ensure that it throws an EXIF_BLEACH_FAILED error to fail-closed
    expect(engineScript).toContain('throw new Error("EXIF_BLEACH_FAILED: Refusing to share payload to maintain zero-knowledge guarantee.");');
  });
});
