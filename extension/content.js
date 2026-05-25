/**
 * StealthRelay Companion — Audited Content Injection Script (V3.1)
 * OWASP Audits: React Virtual-DOM setters, syncHost Auth Synchronization hooks.
 */

(function () {
  try {
    console.log("%c🛡️ StealthRelay Security Engine Active.", "color: #d4af37; font-weight: bold;");

    const emailInputs = new Set();
    const currentHost = window.location.hostname;

    // --- SECURE AUTHENTICATION SYNCHRONIZATION (syncHost Pattern) ---
    // If running on the parent brand website, securely synchronize active user sessions
    // SECURITY PATCH: Restrict checks specifically to stealthrelay.com domain or the designated exact subdomains.
    // Avoid loose wildcard matches on public suffix cloudflare subdomains (like arbitrary pages.dev sites)
    const isTrustedDomain = currentHost === "stealthrelay.com" || 
                            currentHost.endsWith(".stealthrelay.com") ||
                            currentHost === "stealthrelay.pages.dev";

    if (isTrustedDomain) {
      console.log("[StealthRelay Content] syncHost auth synchronizer listening...");

      // 1. Initial Scan: Inspect localStorage for existing JWT or Clerk session tokens
      syncExistingSession();

      // 2. Event Ingress: Listen for login success event broadcasts from Next.js front-end
      window.addEventListener("stealthrelay:auth-sync", (e) => {
        if (e.detail && e.detail.token) {
          const token = e.detail.token;
          chrome.runtime.sendMessage({ action: "SYNC_SESSION_TOKEN", token: token }, (res) => {
            console.log("[StealthRelay Content] Broadcasted session token update to background:", res?.status);
          });
        }
      });
    }

    function syncExistingSession() {
      // Look for typical Clerk, NextAuth, or custom local session keys safely
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("clerk-db-jwt") || key.includes("stealth-auth-token") || key.includes("authToken"))) {
          const tokenVal = localStorage.getItem(key);
          if (tokenVal) {
            chrome.runtime.sendMessage({ action: "SYNC_SESSION_TOKEN", token: tokenVal }, (res) => {
              console.log("[StealthRelay Content] Synchronized existing session on-load:", res?.status);
            });
            break;
          }
        }
      }
    }

    // --- DOM SCANNING & INPUT badges ---
    function scanActiveInputs() {
      const inputs = document.querySelectorAll('input[type="email"], input[name*="email" i], input[id*="email" i]');
      inputs.forEach(input => {
        if (!emailInputs.has(input) && isVisible(input)) {
          emailInputs.add(input);
          injectIsolatedBadge(input);
        }
      });
    }

    function isVisible(el) {
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    // Injects dynamic golden badge enclosed inside Shadow DOM
    function injectIsolatedBadge(inputField) {
      const host = document.createElement("div");
      host.className = "stealth-shield-host";
      host.style.position = "absolute";
      host.style.display = "inline-block";
      host.style.zIndex = "2147483647";
      host.style.pointerEvents = "none";

      const shadowRoot = host.attachShadow({ mode: "open" });

      const styles = document.createElement("style");
      styles.textContent = `
        .stealth-badge-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          pointer-events: auto;
        }
        .stealth-badge {
          width: 18px;
          height: 18px;
          padding: 3px;
          border-radius: 4px;
          background: rgba(20, 19, 16, 0.95);
          border: 1px solid rgba(212, 175, 55, 0.45);
          color: #d4af37;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stealth-badge:hover {
          transform: scale(1.15);
          border-color: #d4af37;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.55);
        }
        .stealth-shield-icon {
          width: 12px;
          height: 12px;
        }
        .stealth-tooltip {
          position: absolute;
          bottom: 28px;
          right: -10px;
          background: #181714;
          border: 1px solid rgba(212, 175, 55, 0.35);
          color: #f7f5f0;
          padding: 5px 9px;
          border-radius: 5px;
          font-size: 11px;
          font-family: 'Outfit', -apple-system, sans-serif;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(0,0,0,0.65);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .stealth-badge:hover + .stealth-tooltip {
          opacity: 1;
        }
        @keyframes stealth-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;

      const wrapper = document.createElement("div");
      wrapper.className = "stealth-badge-wrapper";

      const badge = document.createElement("div");
      badge.className = "stealth-badge";
      badge.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="stealth-shield-icon">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      `;

      const tooltip = document.createElement("div");
      tooltip.className = "stealth-tooltip";
      tooltip.innerText = "Generate StealthRelay Mask?";

      wrapper.appendChild(badge);
      wrapper.appendChild(tooltip);

      shadowRoot.appendChild(styles);
      shadowRoot.appendChild(wrapper);

      const parent = inputField.parentElement;
      if (parent) {
        parent.style.position = parent.style.position || "relative";
        parent.appendChild(host);

        const repositionBadge = () => {
          if (!inputField || !host) return;
          host.style.top = `${inputField.offsetTop + (inputField.offsetHeight - 26) / 2}px`;
          host.style.left = `${inputField.offsetLeft + inputField.offsetWidth - 28}px`;
        };

        repositionBadge();

        inputField.addEventListener("focus", repositionBadge);
        inputField.addEventListener("blur", repositionBadge);
      }

      badge.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        tooltip.innerText = "⌛ Generating secure mask...";
        badge.style.animation = "stealth-spin 1s infinite linear";

        chrome.runtime.sendMessage(
          { action: "GENERATE_MASK_REQUEST", site: window.location.href },
          (response) => {
            badge.style.animation = "none";

            if (response && response.success && response.mask) {
              
              // SECURITY UX PATCH: Virtual DOM / React Value Setter bypass
              // Standard assignment fails to notify internal state managers of React or Angular
              // Firing custom descriptors guarantees value updates the virtual DOM bindings
              try {
                const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                valueSetter.call(inputField, response.mask);
              } catch (err) {
                // Fallback for simple elements
                inputField.value = response.mask;
              }

              // Fire standard updates to keep input reactive
              inputField.dispatchEvent(new Event("input", { bubbles: true }));
              inputField.dispatchEvent(new Event("change", { bubbles: true }));

              tooltip.innerText = "🛡️ Mask Applied!";
              badge.style.background = "#4ade80";
              badge.style.color = "#0e0d0b";
              badge.style.borderColor = "#4ade80";

              setTimeout(() => {
                badge.style.background = "";
                badge.style.color = "";
                badge.style.borderColor = "";
                tooltip.innerText = "Generate StealthRelay Mask?";
              }, 3000);
            } else {
              tooltip.innerText = "⚠️ Log in to StealthRelay";
              badge.style.background = "#ef4444";
              badge.style.color = "#fff";
              badge.style.borderColor = "#ef4444";

              setTimeout(() => {
                badge.style.background = "";
                badge.style.color = "";
                badge.style.borderColor = "";
                tooltip.innerText = "Generate StealthRelay Mask?";
              }, 4000);
            }
          }
        );
      });
    }

    // CORS Bypassed base64 handlers
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "STERILIZE_IMAGE_DATA") {
        sterilizeBase64Image(message.base64Data, message.originalUrl)
          .then(cleanBlob => {
            downloadBleachedFile(cleanBlob, "sanitized_exif_photo.png");
          })
          .catch(err => {
            console.error("[StealthRelay Content] Bleach processing failed:", err);
          });
      } else if (message.action === "STERILIZATION_FAILED") {
        alert(`StealthRelay Error: ${message.error}`);
      }
    });

    function sterilizeBase64Image(base64Data, originalUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Data;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context generation failed."));
            return;
          }

          ctx.drawImage(img, 0, 0);

          canvas.toBlob((cleanBlob) => {
            if (cleanBlob) {
              resolve(cleanBlob);
            } else {
              reject(new Error("Clean blob generation failed."));
            }
          }, "image/png");
        };
        img.onerror = () => reject(new Error("Failed to load base64 source stream."));
      });
    }

    function downloadBleachedFile(blob, filename) {
      const downloadLink = document.createElement("a");
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(url), 10000); // Purge memory buffer safely
    }

    scanActiveInputs();
    const domObserver = new MutationObserver(() => {
      scanActiveInputs();
    });
    domObserver.observe(document.body, { childList: true, subtree: true });

  } catch (err) {
    console.warn("[StealthRelay] Content script restricted on secure tab context.", err.message);
  }
})();
