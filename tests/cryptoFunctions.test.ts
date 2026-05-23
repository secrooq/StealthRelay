import { describe, it, expect, vi } from 'vitest';
import { SecurityEngine } from '../src/workers/securityEngine.worker.ts';

describe('SecurityEngine crypto logic', () => {
  it('PBKDF2 key derivation and AES-GCM seal/unseal work correctly', async () => {
    const engine = new SecurityEngine();
    let messages: any[] = [];
    globalThis.self.postMessage = (msg: any) => {
      messages.push(msg);
    };

    const text = 'test password 123';
    const buffer = new TextEncoder().encode('Hello, world!').buffer;

    await engine.encryptBuffer(buffer, text);

    const encryptMsg = messages.find(m => m.type === 'ENCRYPT_RESULT');
    expect(encryptMsg).toBeDefined();
    expect(encryptMsg.encryptedBuffer).toBeDefined();
    expect(encryptMsg.iv).toBeDefined();
    expect(encryptMsg.salt).toBeDefined();
    expect(encryptMsg.hasPassword).toBe(true);

    // Test unseal
    await engine.decryptBuffer(encryptMsg.encryptedBuffer, encryptMsg.iv, undefined, text, encryptMsg.salt);
    const decryptMsg = messages.find(m => m.type === 'DECRYPT_RESULT');

    expect(decryptMsg).toBeDefined();
    const decryptedText = new TextDecoder().decode(decryptMsg.decryptedBuffer);
    expect(decryptedText).toBe('Hello, world!');
  });

  it('Handles corrupted ciphertexts properly', async () => {
    const engine = new SecurityEngine();
    let messages: any[] = [];
    globalThis.self.postMessage = (msg: any) => {
      messages.push(msg);
    };

    const text = 'test password 123';
    const buffer = new TextEncoder().encode('Hello, world!').buffer;

    await engine.encryptBuffer(buffer, text);
    const encryptMsg = messages.find(m => m.type === 'ENCRYPT_RESULT');

    // Corrupt the ciphertext
    const corruptedBuffer = new Uint8Array(encryptMsg.encryptedBuffer.slice(0));
    corruptedBuffer[0] ^= 1; // flip a bit

    await engine.decryptBuffer(corruptedBuffer.buffer, encryptMsg.iv, undefined, text, encryptMsg.salt);

    const errorMsg = messages.find(m => m.type === 'ERROR');
    expect(errorMsg).toBeDefined();
    expect(errorMsg.message).toBe('Decryption failed.');
  });
});
