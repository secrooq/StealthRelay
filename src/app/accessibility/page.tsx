import React from 'react';
import Link from 'next/link';
import { Eye, ShieldAlert, FileText, ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Accessibility Statement | Stealth Relay',
  description: 'Stealth Relay is committed to making our digital interface accessible to everyone, regardless of technology or ability.',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#040405] text-slate-300 px-6 py-20 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-10">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#d4af37] transition">
            <ChevronLeft className="w-4 h-4" /> [Back to Terminal]
          </Link>
          <h1 className="text-3xl font-mono font-black text-white uppercase tracking-[0.2em] leading-tight">
            Accessibility Statement
          </h1>
          <p className="text-xs text-[#e5c158] font-mono uppercase tracking-widest">
            Last Updated: May 2026 | ADA & WCAG Compliance Commitment
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 font-mono text-xs leading-relaxed text-slate-350">
          <p>
            Stealth Relay is deeply committed to ensuring digital accessibility for individuals with disabilities. We are continuously improving the user experience for everyone, applying the relevant accessibility standards to achieve high compatibility with assistive technologies.
          </p>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            Conformance Status
          </h2>
          <p>
            The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Stealth Relay is fully committed to maintaining conformance with <strong>WCAG 2.1 Level AA</strong>.
          </p>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            Accessibility Features Integrated
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Aria Labels:</strong> Comprehensive use of ARIA attributes to ensure all dynamic elements, dropdowns, and dashboard matrices are fully interpreted by screen readers.
            </li>
            <li>
              <strong>Keyboard Navigation:</strong> Fully keyboard-accessible navigation flows. Interactive interfaces can be traversed seamlessly using standard keyboard controls.
            </li>
            <li>
              <strong>Contrast & Typography:</strong> Dark mode color schemes designed with premium HSL tailored contrasts, providing high contrast and visual clarity for low-vision individuals without sacrificing aesthetics.
            </li>
            <li>
              <strong>Exif & Canvas Obfuscation:</strong> Even though we process canvas image bleaching in-browser, it is optimized to run transparently without affecting page zoom or standard styling parameters.
            </li>
          </ul>

          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 pt-4">
            Feedback & Technical Support
          </h2>
          <p>
            We welcome your feedback on the accessibility of Stealth Relay. If you encounter accessibility barriers, have difficulty reading any operational modules, or require specific accommodations, please reach out directly:
          </p>
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
            <ul className="space-y-1">
              <li>• Email: <span className="text-[#e5c158]">info@stealthrelay.com</span></li>
              <li>• Response Protocol: Within 24-48 Business Hours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
