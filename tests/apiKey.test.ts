import { describe, it, expect } from 'vitest';
import { hashApiKey } from '../src/lib/hash';

describe('hashApiKey', () => {
  it('hashes consistently', async () => {
    const key = 'sr_live_testkey123';
    const hash1 = await hashApiKey(key);
    const hash2 = await hashApiKey(key);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(key);
    expect(hash1.length).toBe(64);
  });
});
