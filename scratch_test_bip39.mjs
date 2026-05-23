import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

try {
    const entropy = new Uint8Array(16);
    const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);
    console.log("SUCCESS:", mnemonic);
} catch(e) {
    console.error("FAIL:", e);
}
