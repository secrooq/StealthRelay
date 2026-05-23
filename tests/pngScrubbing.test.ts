import { describe, it, expect } from 'vitest';
import fs from 'fs';

describe('PNG Metadata Scrubbing Implementation Details', () => {
  it('Should keep only specific critical chunks like IHDR, PLTE, IDAT, IEND, tRNS in worker file', async () => {
    const code = await fs.promises.readFile('./src/workers/securityEngine.worker.ts', 'utf-8');
    expect(code).toContain("const keepChunks = ['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS'];");
  });

  it('Should restrict HEIC format uploads in worker', async () => {
    const code = await fs.promises.readFile('./src/workers/securityEngine.worker.ts', 'utf-8');
    expect(code).toContain("if (fileType === 'image/heic' || fileType === 'image/heif' || fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif')) {");
    expect(code).toContain("self.postMessage({ type: 'ERROR', message: 'HEIC format is blocked at the Edge worker boundary. Client should have transcoded to JPEG.' });");
  });
});
