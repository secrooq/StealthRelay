# StealthRelay Brand Specifications

## Brand Overview
StealthRelay is a zero-trust cryptographic e-mail obfuscation service designed to deliver enterprise-grade secure data relays. Its aesthetic borrows heavily from futuristic cyberpunk consoles, military-grade terminal interfaces, and sleek dark-mode command grids.

---

## Core Philosophy
1. **High Density, Zero Clutter:** Data and controls are structured with rich, clean typography (preferably Mono) without adding excessive decorations.
2. **Active States as Indicators:** Bright glowing colors represent active cryptographic nodes (Emerald/Cyan), while warnings utilize heavy Red accents to clearly communicate operations.
3. **Dynamic & Layered:** UI employs deep backdrops (`bg-[#0a0a0c]`), blurred matrices (`backdrop-blur-md/xl`), and thin border grids (`border-white/10`) to invoke depth.

---

## Color Palette

| Usage | Token/Hex | Tailwind Equivalent |
|---|---|---|
| **Deep Backdrop** | `#050507` / `#0a0a0c` | `bg-[#0a0a0c]` |
| **Primary Accents** | `#a855f7` (Purple-500) | `text-purple-400` / `bg-purple-600` |
| **Cryptographic Cyber** | `#06b6d4` (Cyan-500) | `text-cyan-400` / `border-cyan-500/30` |
| **Operational Emerald** | `#10b981` (Emerald-500) | `text-emerald-400` |
| **DANGER/WARN Vector** | `#ef4444` (Red-500) | `text-red-400` |
| **Primary Readable Text** | `#ffffff` | `text-white` |
| **Secondary Labels** | `#e2e8f0` (Slate-200) | `text-slate-200` |
| **Tertiary Metadata** | `#cbd5e1` (Slate-300) | `text-slate-300` |
| **Borders/Grids** | `rgba(255, 255, 255, 0.1)` | `border-white/10` |

> [!NOTE]
> Do not use `text-gray-500` or `text-slate-800` on pure dark components as this reduces contrast below accessibility limits. Standardize on `text-slate-200` for high visibility and `text-slate-400` for descriptive metadata.

---

## Typography Standards

1. **Display Headings:** Heavy geometric fonts or Wide Sans-Serif. In web implementation: `font-extrabold tracking-tight bg-clip-text`.
2. **Console Metadata / Secondary Controls:** High-readability Monospace fonts (e.g., JetBrains Mono, Fira Code, Roboto Mono). Always use `font-mono` with capitalized letters and `tracking-widest` for structural UI labels (e.g., `[ INBOUND FLEET CONTROL ]`).

---

## Visual Component Glossary

### Card Grids
- **Backdrop:** `bg-white/[0.02]`
- **Edges:** `border border-white/10`
- **Backdrop Filter:** `backdrop-blur-xl`
- **Hover State:** `hover:bg-white/[0.04]` or `ring-2 ring-purple-500/50` for expanded items.

### Buttons
- **Solid High-Contrast:** `bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500`
- **Ghost Operations:** `bg-white/5 border border-white/10 hover:bg-white/10`
- **Vector/Status Triggers:** Subdued color backgrounds combined with clear status icons (e.g., `bg-emerald-950/40 border-emerald-800/50 text-emerald-400`).
