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

## 2024-04-19: Project Structural Refactoring
- **Directory Structure:** Created `/frontend`, `/engine`, and `/docs` root directories to separate concerns.
- **Frontend Assets:** Moved React and Vite files (e.g. `src/`, `index.html`, `package.json`, config files) to `/frontend`.
- **Python Engine:** Moved Python core logic (`Engine.py`, `library.py`, `test_engine.py`) to `/engine`.
- **Documentation:** Moved project documentation (`Blueprint.md`, `AGENTS.md`, `KingMakerRules.md`, `agent-log.md`) to `/docs`.
- **Updates:** Updated `docs/AGENTS.md` to reflect these path changes, and added this entry to `docs/agent-log.md`.
## Completed UI Prologue Alignment

- Fixed Control Stacking: Enforced strict mutual exclusivity within Stage 0 and Stage 1 for intermediate actions. 'Gather Sticks' strictly hides when 'Build Fire' unlocks. 'Gather Timber' and 'Hunt Rations' completely hide when 'Establish Camp' unlocks, eliminating stacked visual artifacts.
- Hid Dashboard Panels: Added a strict `stage >= 2 && (...)` conditional render to entirely remove the World Map and Ledger from the DOM during the prologue, removing hacky opacity toggles.
- Revealed BP Earlier: Made BP explicitly visible in the Ledger starting at Stage 2 so the player can manage resources when starting out.
- Centered the Prologue: Dynamically wrapped the Event Log and control sections in a flex container that vertically centers the interface when `stage < 2`, conveying a clean and intentional minimalist aesthetic.

Successfully built frontend and verified visually with Playwright.
2024-05-18 - Implemented Ruler Actions and Construction Queue in React UI
## $(date +%Y-%m-%d): Refactor Building Construction Loop in App.jsx
- **Feature**: Buildings no longer appear instantly upon purchase. Implemented a `constructionQueue` to track active building projects.
- **Mechanics**: Buildings progress over time, requiring an available "builder" (total Pop minus assigned Pops, defaulting to 1 for the early game).
- **Architecture**: Separated the state calculation (which ticks progress in a `setInterval`) from side-effects (`setWorld`, `addLog`, `setStage`) using dual `useEffect` hooks. This ensures `setConstructionQueue` remains pure and avoids race conditions or duplicate logs in React 18 Strict Mode.
- **UI Visuals**: Active constructions render visually as scaffolding cells using dynamic CSS backgrounds (hazard stripes) and percentage indicators. Idle constructions display an "Awaiting Builder" notice.
## 2026-04-19 - Rewired Hero Selection to Stage 0
Modified frontend/src/App.jsx to make Hero Selection modal appear immediately for new players by using lazy initialization for 'showHeroSelection' with 'localStorage.getItem("adk_ruler")'. Changed the 'onClick' handler for background cards to transition to Stage 0 with an updated log message instead of Stage 4. Refactored the Stage 3 completion button to directly unlock Stage 4 instead of triggering the hero selection modal.

## 2024-05-24: Refactor Hero Selection
- **Frontend Changes**: Moved the Hero Selection modal to Stage 0 (the very beginning of the game). The modal now automatically displays on the first load if no ruler exists in `localStorage`. Background selection now directly places the player into the "Wilderness" (Stage 0) with a specialized starting log rather than skipping to the World Map.
- **Charter Changes**: Simplified the Stage 3 "Sign the Charter" logic in `frontend/src/App.jsx` to immediately transition to Stage 4 without displaying the Hero Selection prompt again.
- **Backend Test Suite Alignment**: Adjusted `engine/Engine.py` to match the new flow (initializing `self.pending_hero_selection = True`) and updated `engine/test_engine.py`'s `setUp` blocks by bypassing the hero selection state explicitly (`self.game.pending_hero_selection = False`). This ensures backend unit tests run correctly without getting stalled on the missing CLI input.

## YYYY-MM-DD - Expanded World Scope
**Changes:**
- Implemented Pathfinding in `frontend/src/hooks/usePopulationEngine.js` by tracking moving pops and passing them via an `onPopsMove` callback.
- Added path values to the grid on the React frontend (`App.jsx`), updating `handlePopsMove` to increment values and rendering paths as a brownish background when `pathValue > 5`.
- Enhanced the Charter Sheet in `engine/Engine.py` and `frontend/src/App.jsx` to explicitly show the Advisors' attributes alongside their names.
- Added World Map Points of Interest ("Ruins" or "Resource Node") to `frontend/src/App.jsx` and `engine/Engine.py`, generating 5 randomly positioned POIs on the map and showing them during reconnoitering/inspecting.
- Added a Tech Tree stub to `frontend/src/App.jsx` with an `unlockedTechs` state that persists to `localStorage`.
