## 2024-04-19 - Text-Heavy Game Interface Logging
**Learning:** Text-heavy game interfaces updating automatically need `role="log"` and `aria-live` tags to ensure screen readers announce background simulation events to users correctly.
**Action:** Always check dynamically updating text logs for ARIA live region attributes to ensure screen reader compatibility.
## 2026-04-19 - Larger UI Grids for Laptops
**Learning:** Dense, tiny grids (32x32px) look smooshed on desktop screens like Chrome. Larger hitboxes (48x48px and 64x64px) for map elements, paired with slightly larger text, greatly improve clickability and visual separation while matching the intended Dwarf Fortress aesthetic.
**Action:** When designing desktop-first grid interfaces, prioritize chunkier target sizes (min 48px) and distinct gaps to ensure elements don't visually merge.
