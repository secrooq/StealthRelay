# 🔒 StealthRelay

> **Defend your digital footprint with mathematical immunity.**

StealthRelay is a premium, enterprise-grade **Zero-Trust Ephemeral Secret Sharing** and **Encrypted Anonymous Email Relay** platform. Engineered for absolute digital sovereignty, it permanently shields identities using high-grade client-side browser cryptography and serverless dynamic relays routed globally through the Cloudflare Edge network.

---

### 🛡️ Core Technologies & Security Credentials

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Cloudflare Edge](https://img.shields.io/badge/Cloudflare-Workers/D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Security Model](https://img.shields.io/badge/Security-Zero--Knowledge-10B981?style=for-the-badge&logo=shield&logoColor=white)
![License](https://img.shields.io/badge/License-AGPL--3.0-FF5A00?style=for-the-badge&logo=opensourceinitiative&logoColor=white)

---

## ⚡ Key Architectural Features

| Feature | Technical Engine | Guarantee |
| :--- | :--- | :--- |
| **Zero-Knowledge Ephemeral Seals** | Local `AES-256-GCM` via Web Crypto API | Keys reside in the URL hash fragment; *never* transmitted to servers. |
| **Edge-Level Rate Limiting** | Cloudflare D1 + Workers KV sliding window check | Prevents brute force scanning and volumetric resource abuse. |
| **RAM-Only EXIF Bleaching** | Client-side Canvas & Binary sanitization array | Complete metadata removal (GPS, camera specs, timestamps) before upload. |
| **Inbound Masking Relays** | Dynamic outbound email alias shielding | Sanitizes web-trackers and cookie beacons, forwarding clean payloads only. |

---

## 🔒 Cryptographic Architecture & Flow

```
+-----------------------------------------------------------------+
|                       CLIENT BROWSER                            |
|                                                                 |
|   1. Local RAM: Bleach Image EXIF (Canvas pixel redraft)       |
|                                                                 |
|   2. Generate local symmetric key: AES-256-GCM                  |
|                                                                 |
|   3. Seal file/payload -> Ciphertext + IV                       |
|                                                                 |
|   4. Generate dynamic link:                                     |
|      https://stealthrelay.io/read/[secret_id]#[aes_key]         |
+---------------------------------+-------------------------------+
                                  |
               Payload (Ciphertext only - NO KEY)
                                  v
+-----------------------------------------------------------------+
|                     CLOUDFLARE EDGE NETWORK                     |
|                                                                 |
|   5. Validate rate limit dynamically via Cloudflare D1          |
|                                                                 |
|   6. Store encrypted ciphertext globally inside Edge KV         |
+-----------------------------------------------------------------+
```

### 1. Zero-Knowledge Cryptographic Seal
All payloads, passwords, and file packets are locked in client-side volatile memory using standard **AES-256-GCM** encryption. The cryptographic key is strictly appended to the URL as a **hash fragment (`#key`)**. 
> [!NOTE]
> Web browsers do not transmit hash fragments to servers during HTTP requests. The server stores only raw, unreadable ciphertext. Decryption is performed entirely inside the recipient's browser.

### 2. Client-Side EXIF Bleaching
Unlike typical backends that process files post-upload, StealthRelay redrafts images inside the local client's browser using HTML5 Canvas pixel arrays. It strips:
* **EXIF Geotags (GPS coordinates)**
* **Camera make, model, and serial numbers**
* **Creation dates and timezone trails**

### 3. Serverless Edge Rate-Limiting
StealthRelay utilizes a sub-millisecond dynamic rate check built on **Cloudflare D1 SQL bindings**, protecting resource utilization securely without adding bulky database roundtrip latency.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18.x or higher
* **Package Manager:** `npm` (compatible with `pnpm`)

### Local Development Setup

1. **Clone & Enter the Repository:**
   ```bash
   git clone https://github.com/secrooq/StealthRelay.git
   cd StealthRelay
   ```

2. **Install Core Dependencies:**
   ```bash
   npm install
   ```

3. **Launch the Development Server:**
   ```bash
   npm run dev
   ```

4. **Verify Application:**
   Open [http://localhost:3000](http://localhost:3000) inside your web browser.

---

## ⚖️ Open Source Verifiability & Trust

To maintain mathematical verifiability of all zero-knowledge and cryptographic promises, this repository remains entirely open source under the **GNU Affero General Public License v3 (AGPL-3.0)**. 

*StealthRelay — Defend your digital footprint with mathematical immunity.*
