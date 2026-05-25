/**
 * StealthRelay Companion — Audited Background Service Worker (V3.2)
 * OWASP audits: MV3 Service Worker base64 encoders, secure message sender whitelisting, context connection wrappers.
 */

// Context Menu IDs
const MENU_SEND_SECRET = "stealthrelay-send-secret";
const MENU_STERILIZE_SHARE = "stealthrelay-sterilize-share";

// Token Expiry Constraint: 24 Hours in Milliseconds
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Initialize Context Menus on Installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("[StealthRelay Background] Initializing audited service worker...");

  // Remove existing to prevent duplication exceptions
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_SEND_SECRET,
      title: "🔒 Send selection via StealthShare",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: MENU_STERILIZE_SHARE,
      title: "📷 Sterilize & Share via StealthVault",
      contexts: ["image"]
    });

    console.log("[StealthRelay Background] Context menu routes registered.");
  });
});

// Handle Context Menu Actions
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab?.id;
  if (!tabId) return;

  // Protect Chrome Internal Pages
  if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
    console.warn("[StealthRelay Background] Blocked script messaging on protected browser tab.");
    return;
  }

  if (info.menuItemId === MENU_SEND_SECRET) {
    const selectedText = info.selectionText;
    console.log("[StealthRelay Background] Captured secret text selection:", selectedText);

    chrome.storage.local.set({ pendingSecretText: selectedText }, () => {
      if (chrome.action.open) {
        chrome.action.open().catch(() => {
          console.log("[StealthRelay Background] Click extension badge to view selection.");
        });
      }
    });

  } else if (info.menuItemId === MENU_STERILIZE_SHARE) {
    const imageUrl = info.srcUrl;
    console.log("[StealthRelay Background] Fetching image via service worker CORS bypass:", imageUrl);

    try {
      const base64Data = await fetchImageAsBase64(imageUrl);
      
      chrome.tabs.sendMessage(tabId, {
        action: "STERILIZE_IMAGE_DATA",
        base64Data: base64Data,
        originalUrl: imageUrl
      }, (response) => {
        // Safe channel error wrapper
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          console.warn("[StealthRelay Background] Direct message rejected. Recipient channel unavailable on this page context.");
        }
      });
    } catch (err) {
      console.error("[StealthRelay Background] CORS bypass fetch failed:", err);
      chrome.tabs.sendMessage(tabId, {
        action: "STERILIZATION_FAILED",
        error: "CORS fetch restriction. Target image host blocks cross-origin reading."
      }, () => {
        const lastErr = chrome.runtime.lastError; // Consume safely
      });
    }
  }
});

/**
 * High-Performance binary buffer stream encoder for Manifest V3 Service Workers.
 * Replaces global FileReader APIs which are unavailable in Service Worker contexts.
 */
async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP status failed: ${response.status}`);
  }
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  
  // Convert byte buffer to base64 synchronously in RAM
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${blob.type};base64,${base64}`;
}

/**
 * Security: Validates that messages originate exclusively from trusted tabs or the local popup context.
 * Prevents malicious third-party pages from spoofing, capturing, or tampering with user credentials.
 */
function isTrustedSender(sender) {
  // 1. Sent from extension popup or internal pages
  if (sender.id === chrome.runtime.id && !sender.tab) {
    return true;
  }
  // 2. Sent from our content scripts executing strictly on production hostnames
  if (sender.tab && sender.tab.url) {
    try {
      const url = new URL(sender.tab.url);
      return url.hostname === "stealthrelay.com" || 
             url.hostname.endsWith(".stealthrelay.com") || 
             url.hostname === "stealthrelay.pages.dev";
    } catch (e) {
      return false;
    }
  }
  return false;
}

// Messaging Gateway (Token lifetime constraints, auto-purges & Sender security scopes)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  // Security Sandbox Containment Check
  if (!isTrustedSender(sender)) {
    console.error("[StealthRelay Background] Blocked message transmission from unauthorized sender source.");
    sendResponse({ error: "Access Denied: Blocked unauthorized messaging endpoint." });
    return false;
  }

  // Use Case: syncHost session update
  if (message.action === "SYNC_SESSION_TOKEN") {
    const token = message.token;
    
    chrome.storage.local.set({ 
      stealthSessionToken: token,
      tokenTimestamp: Date.now() 
    }, () => {
      console.log("[StealthRelay Background] Session token synced with lifetime validation.");
      sendResponse({ status: "synchronized" });
    });
    return true;
  }

  // Use Case: Explicit Session Revocation / Logout Synchronization
  if (message.action === "REVOKE_SESSION") {
    chrome.storage.local.remove(["stealthSessionToken", "tokenTimestamp"], () => {
      console.log("[StealthRelay Background] Session token revoked cleanly.");
      sendResponse({ status: "revoked" });
    });
    return true;
  }

  // Use Case: Dynamic Email Mask Request
  if (message.action === "GENERATE_MASK_REQUEST") {
    const targetSite = message.site;
    
    validateAndGenerateMask(targetSite)
      .then(maskData => {
        sendResponse({ success: true, mask: maskData.mask });
      })
      .catch(err => {
        console.error("[StealthRelay Background] Mask request failed:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep open for async return
  }
});

/**
 * Validates session lifetimes before communicating with edge APIs
 */
async function validateAndGenerateMask(siteUrl) {
  const storage = await chrome.storage.local.get(["stealthSessionToken", "tokenTimestamp"]);
  const token = storage.stealthSessionToken;
  const timestamp = storage.tokenTimestamp;

  if (!token || !timestamp) {
    throw new Error("Authentication required. Please log into stealthrelay.com to synchronize your session key.");
  }

  // Auto-purge token if lifetime exceeds SESSION_EXPIRY_MS (24 Hours)
  if (Date.now() - timestamp > SESSION_EXPIRY_MS) {
    chrome.storage.local.remove(["stealthSessionToken", "tokenTimestamp"]);
    throw new Error("Session expired. Please refresh your stealthrelay.com account page to re-authenticate.");
  }

  let cleanHost = "unknown-context";
  try {
    cleanHost = new URL(siteUrl).hostname.replace("www.", "");
  } catch (e) {
    cleanHost = "raw-context";
  }

  const response = await fetch("https://stealthrelay.com/api/relay/domains", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      domain: cleanHost,
      description: `Generated by StealthRelay Extension for ${cleanHost}`
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Connection Failed: ${errText || response.statusText}`);
  }

  return response.json();
}
