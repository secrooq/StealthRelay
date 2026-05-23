"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { TURNSTILE_SITE_KEY } from "@/lib/constants";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  theme?: "light" | "dark" | "auto";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({
  onVerify,
  theme = "dark",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [siteKey, setSiteKey] = useState("");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/auth/turnstile-config");
        const data = await res.json();
        if (data.siteKey) {
          setSiteKey(data.siteKey);
        }
      } catch (err) {
        console.error("Failed to load Turnstile config:", err);
        setSiteKey("0x4AAAAAAADOfEkQcnejCX1Cd");
      }
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    // Check for turnstile availability periodically or on mount
    const checkReady = () => {
      if (window.turnstile) {
        setIsReady(true);
        return true;
      }
      return false;
    };

    if (!checkReady()) {
      const interval = setInterval(() => {
        if (checkReady()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.turnstile || !siteKey) return;

    let widgetId: string | undefined;

    try {
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: theme,
        callback: (token: string) => {
          onVerify(token);
        },
        "expired-callback": () => {
          onVerify("");
        },
        "error-callback": () => {
          onVerify("");
        }
      });
    } catch (e) {
      console.warn("[TURNSTILE] Render attempt failed, retrying...", e);
    }

    return () => {
      if (window.turnstile && widgetId) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [isReady, siteKey, theme, onVerify]);

  return (
    <div className="turnstile-container flex justify-center my-2 min-h-[65px]">
      <div ref={containerRef} />
    </div>
  );
}
