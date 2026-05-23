import { describe, it, expect } from 'vitest';
import { generateMaskedAlias } from '../src/lib/aliasGenerator';

describe('aliasGenerator', () => {
  it('generates an alias without using Math.random', () => {
    const alias = generateMaskedAlias();
    expect(alias).toMatch(/^[a-z]+-[a-z]+-\d{3}@stealthrelay\.com$/);
  });
});
