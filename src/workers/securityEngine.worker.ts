import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

// Generic Helpers
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryStr = atob(base64);
  const buf = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) buf[i] = binaryStr.charCodeAt(i);
  return buf.buffer;
};

// Define message types
export type WorkerMessage = 
  // StealthSecret
  | { type: 'SCAN_TEXT'; payload: string }
  | { type: 'ENCRYPT'; buffer: ArrayBuffer; password?: string }
  | { type: 'DECRYPT'; encryptedBuffer: ArrayBuffer; ivBuffer: ArrayBuffer; keyBuffer?: ArrayBuffer; password?: string; salt?: string }
  // Vault (New)
  | { type: 'VAULT_GENERATE_MNEMONIC' }
  | { type: 'VAULT_INITIALIZE'; password: string; mnemonic: string; saltStr: string }
  | { type: 'VAULT_UNLOCK'; input: string; saltStr: string; wrappedKeyBase64: string; ivBase64: string }
  | { type: 'VAULT_REKEY'; password: string; rawVaultKeyBase64: string; saltStr: string }
  | { type: 'VAULT_ENCRYPT_FILE'; vaultKeyBase64: string; fileBuffer: ArrayBuffer; fileName: string; fileSize: number; fileType: string }
  | { type: 'VAULT_DECRYPT_FILE'; vaultKeyBase64: string; encryptedFileBuffer: ArrayBuffer; fileIvBase64: string; wrappedKeyBase64: string; encryptedMetaBase64: string; metaIvBase64: string }
  | { type: 'VAULT_DECRYPT_META'; vaultKeyBase64: string; wrappedKeyBase64: string; encryptedMetaBase64: string; metaIvBase64: string; fileId: string }
  // Sharing (New)
  | { type: 'VAULT_PREPARE_SHARE'; vaultKeyBase64: string; encryptedFileBuffer: ArrayBuffer; fileIvBase64: string; wrappedKeyBase64: string; encryptedMetaBase64: string; metaIvBase64: string; stripMetadata?: boolean }
  | { type: 'VAULT_DECRYPT_SHARE_META'; shareKeyBase64: string; encryptedMetaBase64: string; shareIvBase64: string }
  | { type: 'VAULT_DECRYPT_SHARE_FILE'; shareKeyBase64: string; encryptedFileBuffer: ArrayBuffer; shareIvBase64: string };

export type WorkerResponse = 
  | { type: 'PROGRESS'; status: string; progress?: number }
  | { type: 'ERROR'; message: string }
  // StealthSecret Results
  | { type: 'SCAN_RESULT'; isSafe: boolean; details?: any }
  | { type: 'ENCRYPT_RESULT'; encryptedBuffer: ArrayBuffer; iv: ArrayBuffer; keyBuffer?: ArrayBuffer; salt?: string; hasPassword: boolean }
  | { type: 'DECRYPT_RESULT'; decryptedBuffer: ArrayBuffer }
  // Vault Results
  | { type: 'MNEMONIC_RESULT'; mnemonic: string }
  | { type: 'VAULT_INIT_RESULT'; wrappedKeyPwd: { key: string, iv: string }, wrappedKeyRec: { key: string, iv: string }, rawVaultKeyBase64: string }
  | { type: 'VAULT_UNLOCK_RESULT'; rawVaultKeyBase64: string }
  | { type: 'VAULT_REKEY_RESULT'; wrappedKeyPwd: { key: string, iv: string } }
  | { type: 'VAULT_ENCRYPT_RESULT'; encryptedBuffer: ArrayBuffer; fileIv: string; wrappedKey: string; encryptedMeta: string; metaIv: string }
  | { type: 'VAULT_DECRYPT_RESULT'; decryptedBuffer: ArrayBuffer; metadata: { fileName: string, fileSize: number, fileType: string } }
  | { type: 'VAULT_META_RESULT'; fileId: string; metadata: { fileName: string, fileSize: number, fileType: string } }
  // Sharing Results
  | { type: 'VAULT_PREPARE_SHARE_RESULT'; encryptedBuffer: ArrayBuffer; shareKeyBase64: string; shareIvBase64: string; encryptedMetaBase64: string }
  | { type: 'VAULT_DECRYPT_SHARE_META_RESULT'; metadata: { fileName: string } }
  | { type: 'VAULT_DECRYPT_SHARE_FILE_RESULT'; decryptedBuffer: ArrayBuffer };

class SecurityEngine {
  private classifier: any = null;

  async initPipeline() {
    if (!this.classifier) {
      self.postMessage({ type: 'PROGRESS', status: 'Loading AI Engine...', progress: 0 });
      
      // Dynamically load only when scan is actually called
      const TransformersModule: any = await import('@xenova/transformers');
      const pipeline = TransformersModule.pipeline || TransformersModule.default?.pipeline;
      const env = TransformersModule.env || TransformersModule.default?.env;
      
      if (!pipeline || !env) {
        throw new Error("Transformers import failed: pipeline/env not found in module.");
      }

      env.allowLocalModels = false;
      env.useBrowserCache = true;

      this.classifier = await pipeline('text-classification', 'Xenova/toxic-bert', {
        progress_callback: (info: any) => {
          if (info.status === 'progress') {
            const pct = Math.round((info.loaded / info.total) * 100);
            self.postMessage({ type: 'PROGRESS', status: `Downloading AI Model... ${pct}%`, progress: pct });
          }
        }
      });
      self.postMessage({ type: 'PROGRESS', status: 'AI Model Ready', progress: 100 });
    }
  }

  async scanText(text: string) {
    try {
      await this.initPipeline();
      self.postMessage({ type: 'PROGRESS', status: 'Scanning content...' });
      const results = await this.classifier(text);
      const isToxic = results.some((r: any) => r.label === 'toxic' && r.score > 0.8);
      self.postMessage({ type: 'SCAN_RESULT', isSafe: !isToxic, details: results });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: `SCAN_ERROR: ${e.message} -- STACK: ${e.stack}` });
    }
  }

  private async deriveKeyFromText(text: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(text),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000, // Industry standard
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // --- STEALTH SECRET ---
  async encryptBuffer(buffer: ArrayBuffer, password?: string) {
    try {
      self.postMessage({ type: 'PROGRESS', status: 'Generating keys...' });
      let key: CryptoKey;
      let keyBuffer: ArrayBuffer | undefined = undefined;
      let saltStr: string | undefined = undefined;

      if (password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        saltStr = btoa(String.fromCharCode(...salt));
        key = await this.deriveKeyFromText(password, salt.buffer);
      } else {
        key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
        keyBuffer = await crypto.subtle.exportKey('raw', key);
      }

      const iv = crypto.getRandomValues(new Uint8Array(12));
      self.postMessage({ type: 'PROGRESS', status: 'Encrypting data...' });
      const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);

      self.postMessage({
        type: 'ENCRYPT_RESULT',
        encryptedBuffer,
        iv: iv.buffer,
        keyBuffer,
        salt: saltStr,
        hasPassword: !!password
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: e.message });
    }
  }

  async decryptBuffer(encryptedBuffer: ArrayBuffer, ivBuffer: ArrayBuffer, keyBuffer?: ArrayBuffer, password?: string, salt?: string) {
    try {
      let key: CryptoKey;
      if (password && salt) {
        const saltBuffer = base64ToArrayBuffer(salt);
        key = await this.deriveKeyFromText(password, saltBuffer);
      } else if (keyBuffer) {
        key = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt']);
      } else {
        throw new Error("Missing credentials.");
      }

      const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, key, encryptedBuffer);
      self.postMessage({ type: 'DECRYPT_RESULT', decryptedBuffer });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'Decryption failed.' });
    }
  }

  // --- VAULT ZERO-TRUST (PHASE 4) ---
  generateMnemonic() {
    const entropy = crypto.getRandomValues(new Uint8Array(16)); // 128 bits
    const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);
    self.postMessage({ type: 'MNEMONIC_RESULT', mnemonic });
  }

  // Step 1: Create VaultKey and Wrap it twice
  async initializeVault(password: string, mnemonic: string, saltStr: string) {
    try {
      self.postMessage({ type: 'PROGRESS', status: 'Initializing Vault Key...' });
      const saltBuffer = base64ToArrayBuffer(saltStr);

      // 1. Derive derivation keys
      const pwdKey = await this.deriveKeyFromText(password, saltBuffer);
      const recKey = await this.deriveKeyFromText(mnemonic, saltBuffer);

      // 2. Generate absolute random VaultKey
      const vaultKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const rawVaultKey = await crypto.subtle.exportKey('raw', vaultKey);

      // 3. Wrap (encrypt) rawVaultKey using pwdKey
      const ivPwd = crypto.getRandomValues(new Uint8Array(12));
      const wrappedPwd = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivPwd }, pwdKey, rawVaultKey);

      // 4. Wrap using recKey
      const ivRec = crypto.getRandomValues(new Uint8Array(12));
      const wrappedRec = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivRec }, recKey, rawVaultKey);

      self.postMessage({
        type: 'VAULT_INIT_RESULT',
        salt: saltStr,
        wrappedKeyPwd: { key: arrayBufferToBase64(wrappedPwd), iv: arrayBufferToBase64(ivPwd.buffer) },
        wrappedKeyRec: { key: arrayBufferToBase64(wrappedRec), iv: arrayBufferToBase64(ivRec.buffer) },
        rawVaultKeyBase64: arrayBufferToBase64(rawVaultKey)
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'Vault Initialization Failed: ' + e.message });
    }
  }

  // Step 2: Recover VaultKey using user input (Pwd or Mnemonic)
  async unlockVault(input: string, saltStr: string, wrappedKeyBase64: string, ivBase64: string) {
    try {
      self.postMessage({ type: 'PROGRESS', status: 'Validating key...' });
      const saltBuffer = base64ToArrayBuffer(saltStr);
      const wrappedBuffer = base64ToArrayBuffer(wrappedKeyBase64);
      const ivBuffer = base64ToArrayBuffer(ivBase64);

      // Derive the unlocking key
      const derivationKey = await this.deriveKeyFromText(input, saltBuffer);

      // Unwrap the VaultKey
      const rawVaultKey = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        derivationKey,
        wrappedBuffer
      );

      self.postMessage({
        type: 'VAULT_UNLOCK_RESULT',
        rawVaultKeyBase64: arrayBufferToBase64(rawVaultKey)
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'Invalid credentials. Unlock failed.' });
    }
  }

  // Step 2b: Re-key VaultKey under a new password during recovery
  async rekeyVault(password: string, rawVaultKeyBase64: string, saltStr: string) {
    try {
      self.postMessage({ type: 'PROGRESS', status: 'Re-encrypting Vault Key...' });
      const saltBuffer = base64ToArrayBuffer(saltStr);
      const rawVaultKey = base64ToArrayBuffer(rawVaultKeyBase64);

      // Derive derivation key from new password
      const pwdKey = await this.deriveKeyFromText(password, saltBuffer);

      // Wrap rawVaultKey using pwdKey
      const ivPwd = crypto.getRandomValues(new Uint8Array(12));
      const wrappedPwd = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivPwd }, pwdKey, rawVaultKey);

      self.postMessage({
        type: 'VAULT_REKEY_RESULT',
        wrappedKeyPwd: { key: arrayBufferToBase64(wrappedPwd), iv: arrayBufferToBase64(ivPwd.buffer) }
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'Vault Re-keying Failed: ' + e.message });
    }
  }

  // Step 3: Encrypt individual Vault File
  async vaultEncryptFile(vaultKeyBase64: string, fileBuffer: ArrayBuffer, fileName: string, fileSize: number, fileType: string) {
    try {
      self.postMessage({ type: 'PROGRESS', status: 'Packaging file security...' });
      
      // 1. Reconstruct the VaultKey from Base64 for wrapping
      const rawVaultKey = base64ToArrayBuffer(vaultKeyBase64);
      const vaultKey = await crypto.subtle.importKey('raw', rawVaultKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

      // 2. Generate unique FileKey
      const fileKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      const rawFileKey = await crypto.subtle.exportKey('raw', fileKey);

      // 3. Encrypt File Buffer
      const fileIv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedFileBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: fileIv }, fileKey, fileBuffer);

      // 4. Encrypt Metadata (JSON)
      const metaJson = JSON.stringify({ fileName, fileSize, fileType });
      const metaBuffer = new TextEncoder().encode(metaJson);
      const metaIv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedMetaBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: metaIv }, fileKey, metaBuffer);

      // 5. Wrap the FileKey with the VaultKey
      const wrapIv = crypto.getRandomValues(new Uint8Array(12)); // In this design, we skip wrapper IV if we reuse GCM statically? No, always dynamic IV for wrap too. Let's prepend it to the wrapped output for simplicity.
      // Wait, simpler: wrap is also AES-GCM. Let's just return wrapped content.
      const wrappedKeyBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: wrapIv }, vaultKey, rawFileKey);
      
      // Prepend wrapIv to wrappedKeyBuffer so we don't need 500 DB columns
      const finalWrapped = new Uint8Array(wrapIv.length + wrappedKeyBuffer.byteLength);
      finalWrapped.set(wrapIv, 0);
      finalWrapped.set(new Uint8Array(wrappedKeyBuffer), wrapIv.length);

      self.postMessage({
        type: 'VAULT_ENCRYPT_RESULT',
        encryptedBuffer: encryptedFileBuffer,
        fileIv: arrayBufferToBase64(fileIv.buffer),
        wrappedKey: arrayBufferToBase64(finalWrapped.buffer),
        encryptedMeta: arrayBufferToBase64(encryptedMetaBuffer),
        metaIv: arrayBufferToBase64(metaIv.buffer)
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'File encryption failure: ' + e.message });
    }
  }

  async vaultDecryptMeta(vaultKeyBase64: string, wrappedKeyBase64: string, encryptedMetaBase64: string, metaIvBase64: string) {
    try {
      const rawVaultKey = base64ToArrayBuffer(vaultKeyBase64);
      const vaultKey = await crypto.subtle.importKey('raw', rawVaultKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      
      const finalWrapped = new Uint8Array(base64ToArrayBuffer(wrappedKeyBase64));
      const wrapIv = finalWrapped.slice(0, 12);
      const actualWrapped = finalWrapped.slice(12);
      const rawFileKey = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: wrapIv }, vaultKey, actualWrapped);
      const fileKey = await crypto.subtle.importKey('raw', rawFileKey, { name: 'AES-GCM' }, false, ['decrypt']);

      const metaIv = base64ToArrayBuffer(metaIvBase64);
      const encMeta = base64ToArrayBuffer(encryptedMetaBase64);
      const decMetaBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: metaIv }, fileKey, encMeta);
      const metadata = JSON.parse(new TextDecoder().decode(decMetaBuffer));

      return metadata;
    } catch (e) {
      throw new Error("Meta decrypt fail.");
    }
  }

  // Step 4: Decrypt Vault File
  async vaultDecryptFile(vaultKeyBase64: string, encryptedFileBuffer: ArrayBuffer, fileIvBase64: string, wrappedKeyBase64: string, encryptedMetaBase64: string, metaIvBase64: string) {
    try {
      self.postMessage({ type: 'PROGRESS', status: 'Accessing vault object...' });
      
      const metadata = await this.vaultDecryptMeta(vaultKeyBase64, wrappedKeyBase64, encryptedMetaBase64, metaIvBase64);
      
      // Now we need raw file key for payload too, let me just do it manually inside here.
      const rawVaultKey = base64ToArrayBuffer(vaultKeyBase64);
      const vaultKey = await crypto.subtle.importKey('raw', rawVaultKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      const finalWrapped = new Uint8Array(base64ToArrayBuffer(wrappedKeyBase64));
      const wrapIv = finalWrapped.slice(0, 12);
      const actualWrapped = finalWrapped.slice(12);
      const rawFileKey = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: wrapIv }, vaultKey, actualWrapped);
      const fileKey = await crypto.subtle.importKey('raw', rawFileKey, { name: 'AES-GCM' }, false, ['decrypt']);

      // 3. Decrypt Content
      const fileIv = base64ToArrayBuffer(fileIvBase64);
      const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fileIv }, fileKey, encryptedFileBuffer);

      self.postMessage({
        type: 'VAULT_DECRYPT_RESULT',
        decryptedBuffer,
        metadata
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'Vault decryption failure.' });
    }
  }

  // --- ZERO-KNOWLEDGE FILE SHARING ACTIONS ---
  async vaultPrepareShare(vaultKeyBase64: string, encryptedFileBuffer: ArrayBuffer, fileIvBase64: string, wrappedKeyBase64: string, encryptedMetaBase64: string, metaIvBase64: string, stripMetadata?: boolean) {
    try {
      self.postMessage({ type: 'PROGRESS', status: 'Decrypting original vault file...' });
      
      // 1. Decrypt original metadata & file buffer
      const metadata = await this.vaultDecryptMeta(vaultKeyBase64, wrappedKeyBase64, encryptedMetaBase64, metaIvBase64);
      
      const rawVaultKey = base64ToArrayBuffer(vaultKeyBase64);
      const vaultKey = await crypto.subtle.importKey('raw', rawVaultKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      const finalWrapped = new Uint8Array(base64ToArrayBuffer(wrappedKeyBase64));
      const wrapIv = finalWrapped.slice(0, 12);
      const actualWrapped = finalWrapped.slice(12);
      const rawFileKey = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: wrapIv }, vaultKey, actualWrapped);
      const fileKey = await crypto.subtle.importKey('raw', rawFileKey, { name: 'AES-GCM' }, false, ['decrypt']);

      const fileIv = base64ToArrayBuffer(fileIvBase64);
      const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fileIv }, fileKey, encryptedFileBuffer);

      // Metadata stripping for images via Canvas (destroys container tags like EXIF)
      let finalPayload = decryptedBuffer;
      if (stripMetadata && metadata.fileType && metadata.fileType.startsWith('image/') && metadata.fileType !== 'image/gif') {
        try {
          self.postMessage({ type: 'PROGRESS', status: '🔬 Bleaching EXIF tracking data...' });
          const blob = new Blob([decryptedBuffer], { type: metadata.fileType });
          const imgBitmap = await createImageBitmap(blob);
          
          // Standard Web Worker OffscreenCanvas API
          const offscreen = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
          const ctx = offscreen.getContext('2d');
          if (ctx) {
            ctx.drawImage(imgBitmap, 0, 0);
            const sanitizedBlob = await offscreen.convertToBlob({ type: metadata.fileType, quality: 0.92 });
            finalPayload = await sanitizedBlob.arrayBuffer();
          }
        } catch (imgErr) {
          console.warn("Image metadata bleaching failure.", imgErr);
          throw new Error("EXIF_BLEACH_FAILED: Refusing to share payload to maintain zero-knowledge guarantee.");
        }
      }

      // 2. Generate a fresh, absolute random share key & IV
      self.postMessage({ type: 'PROGRESS', status: 'Forging one-time sharing key...' });
      const shareKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      const rawShareKey = await crypto.subtle.exportKey('raw', shareKey);
      const shareIv = crypto.getRandomValues(new Uint8Array(12));

      // 3. Re-encrypt content with share key
      self.postMessage({ type: 'PROGRESS', status: 'Re-encrypting share content...' });
      const sharedFileBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: shareIv }, shareKey, finalPayload);

      // 4. Re-encrypt Metadata (specifically just original filename for now)
      const shareMetaJson = JSON.stringify({ fileName: metadata.fileName });
      const shareMetaBuffer = new TextEncoder().encode(shareMetaJson);
      // We use the same IV for sharing meta as the file since both are isolated under this brand-new key. Wait, cryptographic best practice says never reuse IV for two messages under same key.
      // Let's generate a distinct IV for sharing metadata, OR we prepend it, OR just append a new distinct one. 
      // Simpler: Use distinct IV for meta, and return it or concatenate. Let's just generate metaShareIv and concatenate it to encryptedMetaBase64.
      const metaShareIv = crypto.getRandomValues(new Uint8Array(12));
      const sharedMetaBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: metaShareIv }, shareKey, shareMetaBuffer);
      
      // Pack metaShareIv + sharedMetaBuffer together
      const finalSharedMeta = new Uint8Array(metaShareIv.length + sharedMetaBuffer.byteLength);
      finalSharedMeta.set(metaShareIv, 0);
      finalSharedMeta.set(new Uint8Array(sharedMetaBuffer), metaShareIv.length);

      self.postMessage({
        type: 'VAULT_PREPARE_SHARE_RESULT',
        encryptedBuffer: sharedFileBuffer,
        shareKeyBase64: arrayBufferToBase64(rawShareKey),
        shareIvBase64: arrayBufferToBase64(shareIv.buffer),
        encryptedMetaBase64: arrayBufferToBase64(finalSharedMeta.buffer)
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'Share preparation failed: ' + e.message });
    }
  }

  async vaultDecryptShareMeta(shareKeyBase64: string, encryptedMetaBase64: string) {
    try {
      const rawShareKey = base64ToArrayBuffer(shareKeyBase64);
      const shareKey = await crypto.subtle.importKey('raw', rawShareKey, { name: 'AES-GCM' }, false, ['decrypt']);

      const finalSharedMeta = new Uint8Array(base64ToArrayBuffer(encryptedMetaBase64));
      const metaShareIv = finalSharedMeta.slice(0, 12);
      const actualEncMeta = finalSharedMeta.slice(12);

      const decMetaBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: metaShareIv }, shareKey, actualEncMeta);
      const metadata = JSON.parse(new TextDecoder().decode(decMetaBuffer));

      self.postMessage({
        type: 'VAULT_DECRYPT_SHARE_META_RESULT',
        metadata
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'Invalid or corrupt sharing key.' });
    }
  }

  async vaultDecryptShareFile(shareKeyBase64: string, encryptedFileBuffer: ArrayBuffer, shareIvBase64: string) {
    try {
      self.postMessage({ type: 'PROGRESS', status: 'Decrypting secure transmission...' });
      const rawShareKey = base64ToArrayBuffer(shareKeyBase64);
      const shareKey = await crypto.subtle.importKey('raw', rawShareKey, { name: 'AES-GCM' }, false, ['decrypt']);
      const shareIv = base64ToArrayBuffer(shareIvBase64);

      const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: shareIv }, shareKey, encryptedFileBuffer);

      self.postMessage({
        type: 'VAULT_DECRYPT_SHARE_FILE_RESULT',
        decryptedBuffer
      });
    } catch (e: any) {
      self.postMessage({ type: 'ERROR', message: 'Failed to decrypt shared file payload.' });
    }
  }
}

const engine = new SecurityEngine();

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const data = event.data;
  
  switch (data.type) {
    case 'SCAN_TEXT':
      await engine.scanText(data.payload);
      break;
    case 'ENCRYPT':
      await engine.encryptBuffer(data.buffer, data.password);
      break;
    case 'DECRYPT':
      await engine.decryptBuffer(data.encryptedBuffer, data.ivBuffer, data.keyBuffer, data.password, data.salt);
      break;
    case 'VAULT_GENERATE_MNEMONIC':
      engine.generateMnemonic();
      break;
    case 'VAULT_INITIALIZE':
      await engine.initializeVault(data.password, data.mnemonic, data.saltStr);
      break;
    case 'VAULT_UNLOCK':
      await engine.unlockVault(data.input, data.saltStr, data.wrappedKeyBase64, data.ivBase64);
      break;
    case 'VAULT_REKEY':
      await engine.rekeyVault(data.password, data.rawVaultKeyBase64, data.saltStr);
      break;
    case 'VAULT_ENCRYPT_FILE':
      await engine.vaultEncryptFile(data.vaultKeyBase64, data.fileBuffer, data.fileName, data.fileSize, data.fileType);
      break;
    case 'VAULT_DECRYPT_FILE':
      await engine.vaultDecryptFile(data.vaultKeyBase64, data.encryptedFileBuffer, data.fileIvBase64, data.wrappedKeyBase64, data.encryptedMetaBase64, data.metaIvBase64);
      break;
    case 'VAULT_DECRYPT_META':
      try {
        // Special message handling for meta only
        const res = await engine.vaultDecryptMeta(data.vaultKeyBase64, data.wrappedKeyBase64, data.encryptedMetaBase64, data.metaIvBase64);
        self.postMessage({ type: 'VAULT_META_RESULT', fileId: data.fileId, metadata: res });
      } catch (e) {
        self.postMessage({ type: 'ERROR', message: 'Meta dec fail' });
      }
      break;
    case 'VAULT_PREPARE_SHARE':
      await engine.vaultPrepareShare(data.vaultKeyBase64, data.encryptedFileBuffer, data.fileIvBase64, data.wrappedKeyBase64, data.encryptedMetaBase64, data.metaIvBase64, data.stripMetadata);
      break;
    case 'VAULT_DECRYPT_SHARE_META':
      await engine.vaultDecryptShareMeta(data.shareKeyBase64, data.encryptedMetaBase64);
      break;
    case 'VAULT_DECRYPT_SHARE_FILE':
      await engine.vaultDecryptShareFile(data.shareKeyBase64, data.encryptedFileBuffer, data.shareIvBase64);
      break;
  }
});
