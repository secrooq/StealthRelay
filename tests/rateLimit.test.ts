import { describe, it, expect } from 'vitest';
import fs from 'fs';

describe('Rate Limit Date Handling', () => {
  it('Should use datetime(now) instead of ISOString to match sqlite CURRENT_TIMESTAMP', async () => {
    const code = await fs.promises.readFile('./src/lib/rateLimit.ts', 'utf-8');
    expect(code).toContain("datetime('now', ");
    expect(code).not.toContain("toISOString()");
  });
});
