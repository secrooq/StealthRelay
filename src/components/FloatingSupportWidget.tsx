"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Shield, Ticket, SendHorizonal, ExternalLink, Loader2, Sparkles } from "lucide-react";
import TurnstileWidget from "./TurnstileWidget";

type Tab = "chat" | "ticket" | "uplinks";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function FloatingSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Greetings, operative. I am Stealthbot, your AI Privacy Assistant. I can guide you through local Zero-Knowledge cryptography, Metadata Bleaching, or setting up our Instant Anonymity Terminal. How can I secure your operations?" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ticket form state
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSendingTicket, setIsSendingTicket] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<"idle" | "success" | "error">("idle");

  // Auto-scroll chat thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMsg = userInput.trim();
    setUserInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, { role: "user", content: userMsg }]
        })
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response || "Node consensus lost. Unable to format AI reply." }]);
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Static on the wire. Connection timeout during Edge processing." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail || !ticketMessage || !turnstileToken || isSendingTicket) return;

    setIsSendingTicket(true);
    setTicketStatus("idle");

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ticketEmail,
          subject: `Live Tactical Support Request from ${ticketEmail}`,
          message: ticketMessage,
          turnstileToken: turnstileToken
        })
      });

      if (res.ok) {
        setTicketStatus("success");
        setTicketMessage("");
        setTurnstileToken("");
      } else {
        setTicketStatus("error");
      }
    } catch (err) {
      setTicketStatus("error");
    } finally {
      setIsSendingTicket(false);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[999] font-sans antialiased select-none">
      {/* Core Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[360px] sm:w-[400px] h-[550px] max-h-[80vh] bg-[#050506]/95 border border-white/10 rounded-2xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] backdrop-blur-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          
          {/* Cyber Header */}
          <div className="p-4 bg-gradient-to-b from-emerald-500/10 to-transparent border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-black tracking-widest uppercase text-white">Tactical Hub</h3>
                <p className="text-[10px] text-slate-400 font-mono">Endpoint status: ACTIVE</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Interface */}
          <div className="flex bg-black/30 border-b border-white/5 p-1">
            {[
              { id: "chat", label: "Stealthbot AI", icon: Sparkles },
              { id: "ticket", label: "Secure Ticket", icon: Ticket },
              { id: "uplinks", label: "Uplinks", icon: ExternalLink }
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as Tab)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${
                    active 
                      ? "bg-emerald-500/10 text-emerald-400 shadow-inner border border-emerald-500/10" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-wider font-mono font-bold">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Dynamic Workspace View */}
          <div className="flex-1 overflow-hidden bg-black/20 flex flex-col">
            
            {/* TAB 1: AI CHAT INTERFACE */}
            {activeTab === "chat" && (
              <>
                {/* Scroll Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed font-mono border ${
                        msg.role === "user" 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100 rounded-br-none" 
                          : "bg-white/5 border-white/10 text-slate-200 rounded-bl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 rounded-bl-none text-xs font-mono flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        Processing vector...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Box */}
                <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/5 bg-black/40 flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask Stealthbot security parameters..."
                    className="flex-1 bg-[#0d0d11] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-emerald-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!userInput.trim() || isTyping}
                    className="w-10 h-10 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 hover:text-black rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-400"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* TAB 2: SECURE TICKET FORM */}
            {activeTab === "ticket" && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                {ticketStatus === "success" ? (
                  <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                    <div className="w-14 h-14 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <SendHorizonal className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-mono font-black uppercase tracking-widest text-white">Transmission Confirmed</h4>
                    <p className="text-xs text-slate-400 mt-2 max-w-[250px] leading-relaxed font-mono">Your encrypted support ticket was dispatched to Core Operations. Stand by for reply.</p>
                    <button 
                      onClick={() => setTicketStatus("idle")} 
                      className="mt-6 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-mono uppercase tracking-wider text-white transition"
                    >
                      Send Another Intel
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Return Signal (Email)</label>
                      <input
                        type="email"
                        required
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full bg-[#0d0d11] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Core Intel (Message)</label>
                      <textarea
                        required
                        rows={4}
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Provide precise payload constraints or issues..."
                        className="w-full bg-[#0d0d11] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                      />
                    </div>

                    {/* Human Attestation Gate */}
                    <div className="bg-black/40 border border-white/5 p-1 rounded-xl overflow-hidden">
                      <TurnstileWidget theme="dark" onVerify={setTurnstileToken} />
                    </div>

                    {ticketStatus === "error" && (
                      <p className="text-[10px] text-red-400 font-mono font-bold">⚠ Integrity Failure: Dispatch server rejected submission.</p>
                    )}

                    <button
                      type="submit"
                      disabled={!ticketEmail || !ticketMessage || !turnstileToken || isSendingTicket}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {isSendingTicket ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                        </>
                      ) : (
                        <>
                          <SendHorizonal className="w-4 h-4" /> Transmit Secure Ticket
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: EMERGENCY UPLINKS */}
            {activeTab === "uplinks" && (
              <div className="flex-1 p-6 flex flex-col justify-center space-y-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 mx-auto mb-3">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-mono font-black uppercase tracking-widest text-white">Emergency Channels</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-mono max-w-xs mx-auto">If edge API nodes fail, establish manual contact over encrypted endpoints.</p>
                </div>

                <div className="space-y-3">
                  <a 
                    href="https://t.me/stealthrelay" // Example Telegram
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between bg-[#0d0d11] border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 rounded-xl px-5 py-4 group transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                      <div>
                        <p className="text-xs font-mono font-black uppercase tracking-wider text-white group-hover:text-indigo-400 transition-colors">Direct Telegram</p>
                        <p className="text-[9px] font-mono text-slate-500">Real-time encrypted messenger</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </a>

                  <a 
                    href="mailto:info@stealthrelay.com"
                    className="w-full flex items-center justify-between bg-[#0d0d11] border border-white/10 hover:border-emerald-500/50 hover:bg-white/5 rounded-xl px-5 py-4 group transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                      <div>
                        <p className="text-xs font-mono font-black uppercase tracking-wider text-white group-hover:text-emerald-400 transition-colors">Core Ops Mail</p>
                        <p className="text-[9px] font-mono text-slate-500">info@stealthrelay.com</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] border transition-all duration-300 group ${
          isOpen 
            ? "bg-white text-black border-white scale-95 rotate-90" 
            : "bg-emerald-500 text-black border-emerald-400 hover:scale-105 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-bounce-subtle"
        }`}
        aria-label="Open Support Terminal"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 group-hover:rotate-3 transition-transform" />}
      </button>
    </div>
  );
}
