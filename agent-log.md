# Agent Activity Log

All agents operating within "A Dark Kingdom" must record their significant findings, changes, and fixes to this document at the conclusion of their tasks.

## 2026-04-17: The Awakening & Logic Stabilization
- **Blueprint Enhancement**: Integrated the "Awakening" early game loop into `Blueprint.md` (emulating *A Dark Room* survival loops while retaining *Kingmaker* flavor).
- **Roadmap Shift**: Added 'Phase 4: The Awakening Prologue' into the development roadmap, shifting older timeline goals accordingly.
- **Import Repairs (`Engine.py` & `test_engine.py`)**: Fixed `ModuleNotFoundError` crashes by stripping out broken references to `library.py` and strictly pointing imports to `data_libraries.py`.
- **Logic Debugging (`Engine.py`)**:
  - Rewrote the latter half of `claim_hex()` to eliminate duplicate rule-checking and an unresolved `IndexError`.
  - Corrected indent-based dead code in `build_structure()` to allow uninitialized settlements to be properly instantiated upon building commands.
- **Test Alignment (`test_engine.py`)**: In addition to fixing imports, added `game.stage = 3` overrides to `test_kingdom_build_structure()`. This ensures the tests successfully punch through the early-game limitation checks, resulting in 13/13 tests passing successfully.

## 2026-04-18: Rename data_libraries.py to library.py
- **Import Normalization**: Renamed `data_libraries.py` to `library.py` and updated `Engine.py` and `test_engine.py` to import from `library` instead of `data_libraries`.
- Fixed a soft lock issue where users could navigate to the World Map before Stage 4 and become trapped. Blocked navigation in Engine.py and added a 'Return to Camp' fallback button in App.jsx.

## Update: The Monarch's Dashboard Refactor
- Eliminated all `window.prompt()` and `window.alert()` calls in the React frontend, strictly adhering to the architectural standard requiring custom context windows.
- Replaced legacy prompts with a custom multi-tiered Build Menu Overlay managed via standard `useState` hooks. Menu dynamically categorizes structures from `STRUCTURES_DB` using traits (e.g. "Residential", "Edifice").
- Added a Context-Sensitive Window ("Inspector" Tool) to the primary UI grid. Implemented state bindings `inspectorHex` and `inspectorPop` to display detailed Hex parameters (Terrain, Foraging Yield) and Advisor RPG stats cleanly upon user selection.
- Integrated progressive disclosure UI techniques leveraging `tailwind.config.js` and `transition-all` classes in `App.jsx`, ensuring that elements like the Settlement Map and Ledger smoothly transition and fade based on the unfolding Kingdom stages.
- Added visual feedback triggers, explicitly a "Treasurer's Gavel" scale-and-color flash bound to BP state changes, and a `shake` error animation indicating failed financial checks.
- Confirmed thread-safe React logic structure and generated a production-ready Web build without compilation errors.
Added line-by-line comments to Engine.py, library.py, src/App.jsx, src/main.jsx, src/library.js, and test_engine.py. Added commenting requirement to AGENTS.md. Cleaned up __pycache__.

## 2024-05-24: Optimize grid lookups for triggers
* **Changes**: Implemented hash map lookups to pre-calculate structure counts across the 10x10 hex map and 5x5 internal grids for both `src/App.jsx` and `Engine.py`.
* **Fixes**: Fixed an N+1 problem resulting from checking multiple `PROMINENT_CITIZENS` triggers against the entire map sequentially (O(N*M)).
* **Findings**: Cleaned up the `dist/` and `__pycache__/` folders that were accidentally prepared for commit. Updated the Bolt Journal with findings on the codebase architecture's susceptibility to lookup bottlenecks in tick-based triggers.
## 2026-04-18 - Palette: ARIA Labels

**Learning:** Added ARIA labels to the close buttons in the custom modal interfaces.
**Action:** Always ensure interactive elements with no text content have proper accessible names.

## 2023-11-09 - Added Hero Selection Event

- **Engine.py**:
  - Added 'pending_hero_selection' intermediate state to halt game ticks.
  - Implemented logic to map numeric CLI input to 'library.py' backgrounds.
  - Appended 'ruler' entity to the existing 'self.advisors' dictionary.
- **src/App.jsx**:
  - Implemented 'showHeroSelection' state to control an overlay window.
  - Interrupted standard game loop to wait for player choice.
  - Added 'ruler' specific state and localStorage persisting mechanics.
  - Refined UI Ledger panel to parse and gracefully fall back upon newly tracked 'ruler' object.
- **library.py / src/library.js**:
  - Centralized single source of truth structure for backgrounds (KINGMAKER_BACKGROUNDS).
  - Explicitly mapped string 'attribute' to each predefined background.
## Optimization: Pre-compute grid scans in App.jsx (Bolt)
- **What**: Replaced inline grid traversals in `src/App.jsx` with a single `useMemo` hook (`worldStats`) that pre-computes structure counts, population, and swamp claims.
- **Why**: Prevented redundant O(N*M) grid traversals on every render and during the 5-second simulation tick interval.
- **Impact**: Significantly reduces computational overhead for React re-renders, preventing UI stutter as the settlement expands.
## Enhancements by Palette

- Improved UI accessibility for screen readers in `src/App.jsx` by adding `role="log"`, `aria-live="polite"`, and `aria-atomic="false"` to the main event ledger. This ensures that game state updates and dynamically generated simulation events are properly announced to users relying on assistive technologies.
