/**
 * StealthRelay Companion — Audited Production Popup Manager (V3.2)
 * Cryptographic Alignments: Native WebCrypto AES-GCM, Edge Guest API posts, Photo Intel Quota Sync.
 */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[StealthRelay Popup] Initializing production companion...");

  // DOM Elements
  const tabButtons = document.querySelectorAll(".stealth-tab-btn");
  const tabPanes = document.querySelectorAll(".stealth-tab-pane");
  const statusText = document.querySelector(".stealth-status-text");
  const statusDot = document.querySelector(".stealth-dot");

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      tabPanes.forEach(pane => {
        if (pane.id === targetTab) {
          pane.classList.add("active");
        } else {
          pane.classList.remove("active");
        }
      });
    });
  });

  // SECURE AUTHENTICATION STATE VISUAL CHECKER
  chrome.storage.local.get(["stealthSessionToken", "tokenTimestamp"], (res) => {
    const token = res.stealthSessionToken;
    const timestamp = res.tokenTimestamp;
    const isExpired = timestamp && (Date.now() - timestamp > 24 * 60 * 60 * 1000);

    if (!token || isExpired) {
      if (isExpired) {
        chrome.storage.local.remove(["stealthSessionToken", "tokenTimestamp"]);
      }
      statusText.innerText = "GUEST MODE (SECURE)";
      statusText.style.color = "#d4af37";
      statusDot.style.background = "#d4af37";
      statusDot.style.boxShadow = "0 0 8px #d4af37";
      statusDot.parentElement.style.background = "rgba(212, 175, 55, 0.1)";
      statusDot.parentElement.style.borderColor = "rgba(212, 175, 55, 0.3)";
    }
  });

  // --- TAB 1: SECRETS CONTROLLER (Authentic WebCrypto AES-GCM Client Encryption) ---
  const secretTextarea = document.getElementById("secret-payload");
  const selectBurnTime = document.getElementById("secret-burn-time");
  const btnGenerateSecret = document.getElementById("btn-generate-secret");
  const secretResultBox = document.getElementById("secret-result-box");
  const secretLinkOutput = document.getElementById("secret-link-output");
  const btnCopySecret = document.getElementById("btn-copy-secret");

  chrome.storage.local.get(["pendingSecretText"], (result) => {
    if (result.pendingSecretText) {
      secretTextarea.value = result.pendingSecretText;
      chrome.storage.local.remove(["pendingSecretText"]);
    }
  });

  btnGenerateSecret.addEventListener("click", async () => {
    const text = secretTextarea.value.trim();
    if (!text) {
      alert("Please enter a secret payload to secure.");
      return;
    }

    btnGenerateSecret.innerText = "🔒 CRYPTOGRAPHIC SEVERANCE...";
    btnGenerateSecret.disabled = true;

    try {
      const durationHours = selectBurnTime.value;

      // 1. Generate local cryptographic symmetric key (256-bit AES-GCM)
      const cryptoKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      // 2. Generate random 12-byte initialization vector (IV)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // 3. Encrypt the plaintext payload using WebCrypto Subtle
      const encoder = new TextEncoder();
      const plaintextBuffer = encoder.encode(text);
      const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        plaintextBuffer
      );

      // 4. Export Key as raw bytes to encode to Hex (for zero-knowledge URL Hash)
      const exportedKeyRaw = await crypto.subtle.exportKey("raw", cryptoKey);
      const keyHex = Array.from(new Uint8Array(exportedKeyRaw))
        .map(b => b.toString(16).padStart(2, "0")).join("");

      // 5. Convert IV to Base64
      const ivBase64 = btoa(String.fromCharCode(...iv));

      // 6. Build Multi-part FormData aligned with website guest endpoints
      const fileBlob = new Blob([ciphertextBuffer], { type: "application/octet-stream" });
      const carrierFile = new File([fileBlob], "secret.enc", { type: "application/octet-stream" });

      const formData = new FormData();
      formData.append("file", carrierFile);
      formData.append("isFile", "false");
      formData.append("iv", ivBase64);
      formData.append("hasPassword", "0");
      formData.append("durationHours", durationHours);

      // 7. Post Encrypted Cipher block directly to stealthrelay.com Guest API
      const response = await fetch("https://stealthrelay.com/api/secret/guest", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Edge rejected carrier post: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && resData.id) {
        // Construct Zero-Knowledge Hash URL fragment
        // Symmetric Decryption key sits in Hash Anchor '#' and is NEVER sent to server!
        const secureLink = `https://stealthrelay.com/read/${resData.id}#key=${keyHex}`;
        
        secretLinkOutput.value = secureLink;
        secretResultBox.classList.remove("hidden");
      } else {
        throw new Error(resData.error || "Registry rejected.");
      }

    } catch (err) {
      console.error("[StealthSecrets Companion] Cryptographic Failure:", err);
      alert(`Cryptographic Engine Failure: ${err.message || err}`);
    } finally {
      btnGenerateSecret.innerText = "SECURE AND GENERATE LINK";
      btnGenerateSecret.disabled = false;
    }
  });

  btnCopySecret.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(secretLinkOutput.value);
      
      btnCopySecret.innerText = "COPIED!";
      btnCopySecret.style.background = "#4ade80";
      btnCopySecret.style.color = "#0e0d0b";
      btnCopySecret.style.borderColor = "#4ade80";

      setTimeout(() => {
        btnCopySecret.innerText = "COPY";
        btnCopySecret.style.background = "";
        btnCopySecret.style.color = "";
        btnCopySecret.style.borderColor = "";
      }, 2000);
    } catch (err) {
      console.error("Clipboard copy rejected:", err);
    }
  });

  // --- TAB 2: ALIAS MASK CONTROLLER ---
  const currentSiteDomain = document.getElementById("current-site-domain");
  const btnGenerateAlias = document.getElementById("btn-generate-alias");
  const aliasResultBox = document.getElementById("alias-result-box");
  const aliasOutput = document.getElementById("alias-output");
  const btnCopyAlias = document.getElementById("btn-copy-alias");
  const relaysList = document.getElementById("relays-list");

  let currentTabUrl = "";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].url) {
      try {
        currentTabUrl = tabs[0].url;
        const urlObj = new URL(currentTabUrl);
        currentSiteDomain.innerText = urlObj.hostname.replace("www.", "");
      } catch (e) {
        currentSiteDomain.innerText = "restricted-context";
        btnGenerateAlias.disabled = true;
      }
    } else {
      currentSiteDomain.innerText = "unknown-context";
      btnGenerateAlias.disabled = true;
    }
  });

  updateRecentRelaysList();

  btnGenerateAlias.addEventListener("click", () => {
    btnGenerateAlias.innerText = "⌛ CONTRACTING EDGE...";
    btnGenerateAlias.disabled = true;

    chrome.runtime.sendMessage(
      { action: "GENERATE_MASK_REQUEST", site: currentTabUrl },
      (response) => {
        btnGenerateAlias.innerText = "CREATE NEW MASK";
        btnGenerateAlias.disabled = false;

        if (response && response.success && response.mask) {
          aliasOutput.value = response.mask;
          aliasResultBox.classList.remove("hidden");

          saveAliasLocally(currentSiteDomain.innerText, response.mask);
        } else {
          alert(response?.error || "Authentication required. Please log into stealthrelay.com to synchronize your session key.");
        }
      }
    );
  });

  btnCopyAlias.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(aliasOutput.value);
      
      btnCopyAlias.innerText = "COPIED!";
      btnCopyAlias.style.background = "#4ade80";
      btnCopyAlias.style.color = "#0e0d0b";
      btnCopyAlias.style.borderColor = "#4ade80";

      setTimeout(() => {
        btnCopyAlias.innerText = "COPY";
        btnCopyAlias.style.background = "";
        btnCopyAlias.style.color = "";
        btnCopyAlias.style.borderColor = "";
      }, 2000);
    } catch (err) {
      console.error("Clipboard copy rejected:", err);
    }
  });

  function saveAliasLocally(domain, mask) {
    chrome.storage.local.get(["savedRelays"], (result) => {
      const relays = result.savedRelays || [];
      if (!relays.find(r => r.mask === mask)) {
        relays.unshift({ domain, mask, timestamp: Date.now() });
        if (relays.length > 5) relays.pop();
        chrome.storage.local.set({ savedRelays: relays }, () => {
          updateRecentRelaysList();
        });
      }
    });
  }

  function updateRecentRelaysList() {
    chrome.storage.local.get(["savedRelays"], (result) => {
      const relays = result.savedRelays || [];
      if (relays.length === 0) {
        relaysList.innerHTML = "";
        const emptyMsg = document.createElement("p");
        emptyMsg.className = "stealth-empty-msg";
        emptyMsg.textContent = "No active email forwarders generated in this session.";
        relaysList.appendChild(emptyMsg);
        return;
      }

      relaysList.innerHTML = "";
      relays.forEach(item => {
        const itemRow = document.createElement("div");
        itemRow.className = "stealth-alias-item";
        
        const aliasSpan = document.createElement("span");
        aliasSpan.className = "stealth-alias-name";
        aliasSpan.setAttribute("title", item.domain);
        aliasSpan.textContent = item.mask.length > 24 ? item.mask.substring(0, 22) + '...' : item.mask;

        const copyBtn = document.createElement("button");
        copyBtn.className = "stealth-alias-copy-btn";
        copyBtn.setAttribute("data-copy", item.mask);
        copyBtn.textContent = "COPY";

        itemRow.appendChild(aliasSpan);
        itemRow.appendChild(copyBtn);
        relaysList.appendChild(itemRow);
      });

      document.querySelectorAll(".stealth-alias-copy-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const textToCopy = btn.getAttribute("data-copy");
          try {
            await navigator.clipboard.writeText(textToCopy);
            btn.innerText = "COPIED!";
            setTimeout(() => {
              btn.innerText = "COPY";
            }, 1500);
          } catch (err) {
            console.error("Clipboard copy failed:", err);
          }
        });
      });
    });
  }

  // --- TAB 3: PHOTO INTEL FORENSICS (EXIF Bleach Sandbox & Quota Sync) ---
  const dragDropZone = document.getElementById("drag-drop-zone");
  const fileInput = document.getElementById("sandbox-file-input");
  const successBox = document.getElementById("sandbox-success-box");
  const btnDownloadBleached = document.getElementById("btn-download-bleached");
  const quotaCountText = document.getElementById("bleach-quota-count");

  let bleachedBlob = null;
  let bleachedFileName = "";
  let currentBleachCount = 0;

  // Retrieve current active Photo Intel limit quota on launch
  syncBleachLimits();

  async function syncBleachLimits() {
    try {
      const response = await fetch("https://stealthrelay.com/api/bleach/limit");
      const data = await response.json();
      if (data.success && typeof data.count === "number") {
        currentBleachCount = data.count;
        quotaCountText.innerText = `${currentBleachCount}/3 BLEACHES USED`;
      }
    } catch (err) {
      console.log("[Stealth Photo Intel] Anonymous quota checking localized.");
    }
  }

  dragDropZone.addEventListener("click", () => fileInput.click());

  dragDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragDropZone.style.borderColor = "#d4af37";
    dragDropZone.style.background = "rgba(212, 175, 55, 0.08)";
  });

  dragDropZone.addEventListener("dragleave", () => {
    dragDropZone.style.borderColor = "rgba(212, 175, 55, 0.3)";
    dragDropZone.style.background = "rgba(14, 13, 11, 0.4)";
  });

  dragDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDropZone.style.borderColor = "rgba(212, 175, 55, 0.3)";
    dragDropZone.style.background = "rgba(14, 13, 11, 0.4)";

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPhotoFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      processPhotoFile(e.target.files[0]);
    }
  });

  async function processPhotoFile(file) {
    if (!file.type.startsWith("image/")) {
      dragDropZone.style.borderColor = "#ef4444";
      dragDropZone.style.background = "rgba(239, 68, 68, 0.05)";
      dragDropZone.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="stealth-cloud-icon" style="color: #ef4444;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="stealth-drag-text" style="color: #ef4444; font-weight: 700;">INVALID FORMAT — IMAGES ONLY</span>
      `;
      setTimeout(() => {
        resetDragZone();
      }, 4000);
      return;
    }

    // Limit check matching Photo Intel limits
    if (currentBleachCount >= 3) {
      dragDropZone.style.borderColor = "#ef4444";
      dragDropZone.style.background = "rgba(239, 68, 68, 0.05)";
      dragDropZone.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="stealth-cloud-icon" style="color: #ef4444;">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span class="stealth-drag-text" style="color: #ef4444; font-weight: 700;">FREE ANONYMOUS DAILY LIMIT EXCEEDED</span>
      `;
      setTimeout(() => {
        resetDragZone();
      }, 5000);
      return;
    }

    dragDropZone.innerHTML = `
      <div class="stealth-spin-loader"></div>
      <span class="stealth-drag-text">STRIPPING METADATA IN RAM CANVAS...</span>
    `;

    bleachedFileName = `STEALTH_SECURE_${file.name.replace(/\.[^/.]+$/, "")}.png`;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("Canvas generation failed.");
        resetDragZone();
        URL.revokeObjectURL(objectUrl); // Secure memory purge
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        URL.revokeObjectURL(objectUrl); // Secure memory purge immediately!
        
        if (blob) {
          bleachedBlob = blob;
          dragDropZone.classList.add("hidden");
          successBox.classList.remove("hidden");

          // Increment bleach limit on Edge database
          try {
            const incrementRes = await fetch("https://stealthrelay.com/api/bleach/limit", { method: "POST" });
            const limitData = await incrementRes.json();
            if (limitData.success && typeof limitData.count === "number") {
              currentBleachCount = limitData.count;
              quotaCountText.innerText = `${currentBleachCount}/3 BLEACHES USED`;
            }
          } catch (e) {
            currentBleachCount++;
            quotaCountText.innerText = `${currentBleachCount}/3 BLEACHES USED`;
          }

        } else {
          alert("Image conversion error.");
          resetDragZone();
        }
      }, "image/png");
    };

    img.onerror = () => {
      alert("Photo draw error.");
      resetDragZone();
      URL.revokeObjectURL(objectUrl); // Secure memory purge
    };
  }

  function resetDragZone() {
    dragDropZone.style.borderColor = "";
    dragDropZone.style.background = "";
    dragDropZone.classList.remove("hidden");
    successBox.classList.add("hidden");
    dragDropZone.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stealth-cloud-icon">
        <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.5-2-2.4-3.5-4.4-3.5h-1.2C15.6 4.8 12.8 3 9.5 3 5.4 3 2 6.4 2 10.5c0 .5.1 1 .2 1.5-.9.6-1.5 1.7-1.5 2.9C.7 17 3 19 5.8 19h13.8c2.4 0 4.4-1.8 4.4-4z"/>
        <polyline points="16 16 12 12 8 16"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
      </svg>
      <span class="stealth-drag-text">DRAG PHOTO HERE OR CLICK TO BROWSE</span>
    `;
  }

  btnDownloadBleached.addEventListener("click", () => {
    if (!bleachedBlob) return;

    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(bleachedBlob);
    downloadLink.download = bleachedFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => {
      resetDragZone();
      bleachedBlob = null;
    }, 1500);
  });
});
