# StealthRelay

StealthRelay is a premium, state-of-the-art Zero-Trust Ephemeral Sharing and Encrypted Email Relay platform. Engineered for absolute digital sovereignty, it masks your digital identity using client-side cryptography and dynamic serverless relays on the Cloudflare global network.

---

## 🔒 Security & Cryptographic Architecture

StealthRelay operates on a strict **Zero-Knowledge** model. Your private data is never exposed, decrypted, or logged by intermediate servers.

### **1. Client-Side Cryptographic Seal**
All secrets, passwords, and file transfers are sealed inside the browser's active memory before network transmission using local **AES-256-GCM** encryption. The cryptographic keys reside entirely in the browser URL hash fragment (which is never sent to the server) to ensure absolute zero-knowledge security.

### **2. Local EXIF Metadata Sanitization**
Before upload, files are redrafted and reconstructed inside local RAM to permanently scrub embedded EXIF geofences, camera specifications, timestamp trails, and other identifying headers.

### **3. Inbound Identity Masking**
StealthRelay dynamically generates inbound email masks, automatically sanitizing, stripping tracking cookies/trackers, and forwarding inbound mail to your real destination address without revealing your digital footprint.

---

## 🚀 Getting Started

To run the development server locally:

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the client-side dashboard in your browser.

---

## ⚖️ License & Open Source Verifiability

StealthRelay is committed to absolute transparency. To guarantee the cryptographic authenticity of our zero-knowledge claims, this repository is fully open-source.

This project is licensed under the **GNU Affero General Public License v3 (AGPL-3.0)**. For more details, see the official [LICENSE](./LICENSE) file.

---

*StealthRelay - Defend your digital footprint with mathematical immunity.*
