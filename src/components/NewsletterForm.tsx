"use client";

import { useState } from "react";
import TurnstileWidget from "./TurnstileWidget";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (!turnstileToken) {
      setStatus({ type: "error", message: "Please complete the anti-bot security challenge." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: data.message || "Secure link established. Check your inbox soon." });
        setEmail("");
      } else {
        setStatus({ type: "error", message: data.error || "Synchronization aborted. Please try again." });
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network interference detected. Verification failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-xl overflow-hidden transition-all duration-300 focus-within:border-[#d4af37]/50 focus-within:shadow-[0_0_30px_rgba(212,175,55,0.1)]">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your secure email address"
            className="flex-1 bg-transparent border-none outline-none text-white px-4 py-4 text-[17px] placeholder:text-slate-500 font-sans focus:ring-0"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="sm:w-auto w-full px-8 py-4 bg-[#d4af37] text-black text-[15px] font-sans font-extrabold uppercase tracking-wider rounded-lg hover:bg-[#e5c158] disabled:bg-[#d4af37]/50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_25px_rgba(212,175,55,0.15)] flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              "Secure Handbook"
            )}
          </button>
        </div>

        {/* Turnstile Injection Zone */}
        <div className="mt-2 opacity-90 transform transition-all duration-500 flex justify-center">
          <TurnstileWidget onVerify={setTurnstileToken} />
        </div>

        {status && (
          <div
            className={`mt-4 p-4 rounded-lg text-[15px] border animate-in fade-in slide-in-from-top-2 font-sans ${
              status.type === "success"
                ? "bg-[#d4af37]/5 border-[#d4af37]/20 text-[#e5c158]"
                : "bg-red-500/5 border-red-500/20 text-red-400"
            } flex items-center gap-3`}
          >
            {status.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
