# Palette Journal

## 2024-04-19 - Text-Heavy Game Interface Logging
**Learning:** Text-heavy game interfaces updating automatically need `role="log"` and `aria-live` tags to ensure screen readers announce background simulation events to users correctly.
**Action:** Always check dynamically updating text logs for ARIA live region attributes to ensure screen reader compatibility.
## 2026-04-19 - Larger UI Grids for Laptops
**Learning:** Dense, tiny grids (32x32px) look smooshed on desktop screens like Chrome. Larger hitboxes (48x48px and 64x64px) for map elements, paired with slightly larger text, greatly improve clickability and visual separation while matching the intended Dwarf Fortress aesthetic.
**Action:** When designing desktop-first grid interfaces, prioritize chunkier target sizes (min 48px) and distinct gaps to ensure elements don't visually merge.
## 2026-04-20 - [Accessibility: Hero Selection Keyboard Traps]
**Learning:** The Hero Selection background choices were implemented as clickable <div> elements, acting as keyboard traps which prevented screen reader/keyboard users from starting the game sequence. Changing them to semantic <button> elements with proper focus styles ensures keyboard navigation works consistently without disrupting the visual design.
**Action:** Always prefer semantic interactive elements like <button> over <div> with onClick when building choice menus, and always verify clear focus rings (focus:ring-2) for keyboard navigability.
## 2026-04-21 - Replace interactive `div` with `button`
**Learning:** Found that core interactive map elements (`SettlementGrid`, `WorldGrid`) and the Kingdom Ledger advisors used interactive `<div onClick={...}>` components which lacked proper semantics and key accessibility features like tab focus and keypress activation.
**Action:** Replaced interactive `div` wrappers with semantic `button` tags. Appended `type="button"`, `aria-label`, and `focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none` styles to enable keyboard navigation while preserving the existing aesthetics (e.g., adding `text-left w-full` to the advisor items to override `button` defaults).
