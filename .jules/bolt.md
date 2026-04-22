# Bolt Journal

## 2024-05-24 - Pre-compute grid scans for trigger conditions
**Learning:** Checking triggers across the 10x10 hex map with its 5x5 sub-grids in `Engine.py` and `src/App.jsx` can quickly lead to an N+1 problem (in this case repeating O(N*M) lookups) when checked per triggered objective.
**Action:** Always pre-compute a structure count hash map via a single pass when checking multiple world conditions per game tick or when multiple triggers are being tested sequentially.

## 2026-04-21 - Replace O(n²) nested loop with O(n) hash map lookup in SettlementGrid
**Learning:** In React components like `SettlementGrid`, doing nested array scans using `.find()` or `.filter()` inside map iterations causes severe N+1 re-render bottlenecks (O(N²) complexity), especially when scanning things like local populations or construction queues.
**Action:** Pre-compute an O(1) hash map dictionary outside the render loop for arrays like populations and job queues, significantly reducing lookup times during rendering.
