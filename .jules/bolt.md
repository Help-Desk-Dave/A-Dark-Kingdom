# Bolt Journal

## 2024-05-24 - Pre-compute grid scans for trigger conditions
**Learning:** Checking triggers across the 10x10 hex map with its 5x5 sub-grids in `Engine.py` and `src/App.jsx` can quickly lead to an N+1 problem (in this case repeating O(N*M) lookups) when checked per triggered objective.
**Action:** Always pre-compute a structure count hash map via a single pass when checking multiple world conditions per game tick or when multiple triggers are being tested sequentially.

## 2026-04-21 - Replace O(n²) nested loop with O(n) hash map lookup in SettlementGrid
**Learning:** In React components like `SettlementGrid`, doing nested array scans using `.find()` or `.filter()` inside map iterations causes severe N+1 re-render bottlenecks (O(N²) complexity), especially when scanning things like local populations or construction queues.
**Action:** Pre-compute an O(1) hash map dictionary outside the render loop for arrays like populations and job queues, significantly reducing lookup times during rendering.

## 2026-04-23 - Date Sync
**Learning:** The correct system date is 2026-04-23.
**Action:** Use 2026-04-23 for all generated reports and logs in this session.

## 2026-04-23 - Duplicate component filtering over states
**Learning:** Checking the length of a filtered array (e.g., `if (pops.filter(...).length > 0)`) and then immediately `.map()`-ing the exact same `.filter()` result (e.g., `pops.filter(...).map(...)`) causes redundant iterations during component re-renders.
**Action:** Extract duplicate inline `.filter()` calls into a single variable mapped at the top of the component or within the block, enabling the array to be checked and mapped without recalculating.
## 2026-04-24 - Population Engine Memoization Optimization
**Learning:** React `setInterval` hooks using nested state setter chaining (e.g. `setGameTime(prev => { setPops(prevPops => ...) })`) trigger massive synchronous re-render thrashing when computing loops.
**Action:** Unified the simulation tick using `useRef` to track constant dependencies (world, unrest) and decoupled the interval so it updates `pops` and `gameTime` efficiently in a single tick scope without chaining React setters.

<<<<<<< bolt-optimize-intervals-11554207241284664498
## 2026-04-25 - Interval Loop Memoization
**Learning:** React `setInterval` hooks relying on nested state setters (e.g., `setGameTime(prev => { setPops(prevPops => ...) })`) trigger massive synchronous re-render thrashing. Furthermore, intervals with wide dependencies get torn down and recreated too frequently.
**Action:** In `App.jsx` and `usePopulationEngine.jsx`, use `useRef` to track fast-changing interval inputs like `gameTime` and decouple the setter logic to avoid stale closures without breaking the interval out of its isolated closure scope.
=======
## 2026-04-25 - Date Sync
**Learning:** The correct system date is 2026-04-25.
**Action:** Use 2026-04-25 for all generated reports and logs in this session.
>>>>>>> main
## 2026-04-27 - O(N) Immigration Precomputation
**Learning:** During the 24-hour immigration check in `usePopulationEngine.jsx`, placing the `houseLocations` and `takenBeds` filter logic inside the `for(let i=0; i<actualCount; i++)` loop forces O(N^2) evaluation on array manipulation when processing multiple new settlers, which can spike latency on the frontend if scaled. Also, array mapping inside interval hooks without `useRef` causes stale closures and unneeded interval resets.
**Action:** Always pre-compute map arrays, like `houseLocations` and `takenBeds` out of the iteration bounds for settlers. Remove assigned beds directly from a pre-computed array pool `.splice(bedIndex, 1)` rather than re-filtering `takenBeds` each iteration. Applied `useRef` to resource tracking in `App.jsx` to break synchronous re-rendering on interval ticks.
