# Mason Journal
## 2025-04-20 - Extracted WorldGrid and SettlementGrid
**Learning:** `App.jsx` contained large nested render functions (`renderWorldGrid`, `renderSettlementGrid`) tightly coupled to its internal state, contributing to its massive ~1600 line size. This makes the component difficult to navigate and maintain.
**Action:** Extracted these grid components into `frontend/src/components/WorldGrid.jsx` and `frontend/src/components/SettlementGrid.jsx`. In the future, actively look for and extract `render*` functions in monolithic components into their own modular files to reduce bloat.
