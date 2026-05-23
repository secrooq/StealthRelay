"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Database, Mail } from "lucide-react";
import { useSession } from "next-auth/react";

export default function DashboardBottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navItems = [
    { name: "Secret", href: "/secret", icon: Lock },
    { name: "Vault", href: "/vault", icon: Database },
    { name: "Relay", href: "/relay", icon: Mail },
  ];

  const isSignedIn = status === "authenticated";

  if (!isSignedIn) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050507]/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-300">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-1 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "text-[#e5c158]" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className={`p-2 rounded-lg transition-all ${
                isActive ? "bg-[#d4af37]/15 shadow-[0_0_15px_rgba(212,175,55,0.15)]" : ""
              }`}>
                <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : "scale-100"} transition-transform`} />
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-widest font-black ${isActive ? "text-[#e5c158]" : "text-slate-400"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
