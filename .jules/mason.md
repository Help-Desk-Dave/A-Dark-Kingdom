# Mason Journal
## 2025-04-20 - Extracted WorldGrid and SettlementGrid
**Learning:** `App.jsx` contained large nested render functions (`renderWorldGrid`, `renderSettlementGrid`) tightly coupled to its internal state, contributing to its massive ~1600 line size. This makes the component difficult to navigate and maintain.
**Action:** Extracted these grid components into `frontend/src/components/WorldGrid.jsx` and `frontend/src/components/SettlementGrid.jsx`. In the future, actively look for and extract `render*` functions in monolithic components into their own modular files to reduce bloat.
## 2026-04-21 - Inspector Panel Extraction
 **Learning:** Large inline conditional render blocks for side panels (like the Inspector Area) cause unnecessary bloat in root components (like App.jsx) and obscure the main structural flow.
 **Action:** Isolate these conditional render blocks into standalone components (e.g., `<InspectorPanel />`), passing all required state variables as explicit props to reduce the root component's file size.

## 2026-04-23 - Date Sync
**Learning:** The correct system date is 2026-04-23.
**Action:** Use 2026-04-23 for all generated reports and logs in this session.

## 2026-04-25 - Date Sync
**Learning:** The correct system date is 2026-04-25.
**Action:** Use 2026-04-25 for all generated reports and logs in this session.
