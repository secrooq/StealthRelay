## 2024-05-24 - Accessibility Enhancements
**Learning:** Custom toggle switches in the UI (implemented as styled `button` elements) lack semantic meaning for screen readers. Icon-only buttons (like Trash, X, Copy) also require explicit labels.
**Action:** Always add `role="switch"` and dynamic `aria-checked={state}` attributes to custom toggle components. Add descriptive `aria-label` attributes to any buttons that rely solely on icons for visual communication.
