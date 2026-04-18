## 2024-05-24 - Pre-compute grid scans for trigger conditions
**Learning:** Checking triggers across the 10x10 hex map with its 5x5 sub-grids in `Engine.py` and `src/App.jsx` can quickly lead to an N+1 problem (in this case repeating O(N*M) lookups) when checked per triggered objective.
**Action:** Always pre-compute a structure count hash map via a single pass when checking multiple world conditions per game tick or when multiple triggers are being tested sequentially.
