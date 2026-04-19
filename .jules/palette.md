## 2024-04-19 - Text-Heavy Game Interface Logging
**Learning:** Text-heavy game interfaces updating automatically need `role="log"` and `aria-live` tags to ensure screen readers announce background simulation events to users correctly.
**Action:** Always check dynamically updating text logs for ARIA live region attributes to ensure screen reader compatibility.
