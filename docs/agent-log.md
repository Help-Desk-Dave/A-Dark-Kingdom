# Agent Activity Log

## Midnight Log Summaries

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
## 2024-05-19: Refactor Building Construction Loop in App.jsx
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

## Manual Labor Heaviness & Failure Logic
*   **What was changed:** Added progressive ASCII art to Stage 0 campfire based on sticks count. Introduced a `ProgressBar` React component. Replaced all instantaneous manual actions (Help Build, Gather Timber, Hunt Rations) with progress bars. Implemented a failure chance (`failMod`) tied to the player's background across both Python and React codebases, with specific log outputs when tasks fail.
*   **Why it was changed:** To make early game survival actions feel "heavier" and less trivial to click-spam, and to integrate background choice directly into gameplay mechanics early on.
## YYYY-MM-DD - Expanded World Scope
**Changes:**
- Implemented Pathfinding in `frontend/src/hooks/usePopulationEngine.js` by tracking moving pops and passing them via an `onPopsMove` callback.
- Added path values to the grid on the React frontend (`App.jsx`), updating `handlePopsMove` to increment values and rendering paths as a brownish background when `pathValue > 5`.
- Enhanced the Charter Sheet in `engine/Engine.py` and `frontend/src/App.jsx` to explicitly show the Advisors' attributes alongside their names.
- Added World Map Points of Interest ("Ruins" or "Resource Node") to `frontend/src/App.jsx` and `engine/Engine.py`, generating 5 randomly positioned POIs on the map and showing them during reconnoitering/inspecting.
- Added a Tech Tree stub to `frontend/src/App.jsx` with an `unlockedTechs` state that persists to `localStorage`.
## Population Engine Rewrite
* **Goal**: Sync the visual population with the underlying game data, assign beds within homes to citizens, establish a circadian rhythm, and replace instant spawning with an organic "word of mouth" immigration system.
* **Changes**:
    *   Rewrote `usePopulationEngine.js` to manage `gameTime` and assign exact `homeCoords` and `bedId` to pops when housing is available.
    *   Added a check for organic growth at `hour === 0`, with a 20% chance to spawn 1-2 new pops if housing is available.
    *   Added a circadian rhythm logic that sends pops home to enter a 'Sleeping' state between 22:00 and 06:00.
    *   Updated `App.jsx` to pass `unrest` and `addLog` to the population engine.
    *   Wrapped `addLog` in `React.useCallback` to prevent infinite re-render loops when passed as a dependency.
    *   Used `pops.length` directly for population count instead of relying on theoretical housing capacity.
## 2024-04-19 - Calendar and Supply Chain Update
- Replaced `tickCount` with an hourly `gameTime` clock (1 second = 1 game hour).
- Overhauled material economy: BP shifted to an 'Influence' role, while structures now cost `Timber`, `Rations`, and a new `Stone` resource.
- Implemented a daily production cycle where structures like the new 'Pier' produce raw materials at hour 0.
## 2024-05-19 - Fixed syntax errors in React hooks
**Learning:** Encountered malformed React closures due to incomplete copy-pastes/edits. The  closure in `App.jsx` was broken, and `usePopulationEngine.jsx` had multiple repeated declarations and misaligned brackets.
**Action:** Ensure clean diff updates when fixing syntax errors and build warnings. Double-check all React state functional updates for proper parenthesis and brackets to not break standard JavaScript/JSX build parsers.
## 2024-05-19 - Fixed syntax errors in React hooks
**Learning:** Encountered malformed React closures due to incomplete copy-pastes/edits. The `addLog` closure in `App.jsx` was broken, and `usePopulationEngine.jsx` had multiple repeated declarations and misaligned brackets.
**Action:** Ensure clean diff updates when fixing syntax errors and build warnings. Double-check all React state functional updates for proper parenthesis and brackets to not break standard JavaScript/JSX build parsers.
- Fixed a crash caused by an undefined `tickCount` state variable in `frontend/src/App.jsx`.
- Implemented an `ErrorBoundary` component in `frontend/src/ErrorBoundary.jsx` and applied it in `frontend/src/main.jsx` to catch and gracefully display rendering errors, preventing silent white-screen failures.
## Component Extraction Refactor
**Date:** $(date +%Y-%m-%d)
**Agent:** Mason
**Changes:**
- Extracted inline rendering logic from `frontend/src/App.jsx` into standalone React functional components to improve maintainability.
- Created `BuildMenu.jsx`, `HeroSelection.jsx`, and `GameMenu.jsx` in the `frontend/src/components/` directory.
- Refactored `App.jsx` to import and compose these new components, passing necessary state and setter functions via props.
- Verified that functionality and styling (Tailwind CSS) remained intact across the isolated components.

## 2024-05-19 - Refactor Ruler/Founder Mechanics
**Action:** Refactored the Ruler/Founder agent mechanics to fix core gameplay issues:
- **Consolidated Redundant Actions:** Removed the instant action buttons for gathering timber and hunting rations in the React frontend, leaving only the effort-simulating `ProgressBar` versions to respect the `failMod` attribute.
- **Enforced Single-Action Limit (Python Engine):** Added an `is_busy` state to the `Kingdom` class. Manual actions (like gathering or hunting) now block further actions until the state resets on the next tick (`tick()` cycle).
- **Enforced Single-Action Limit (React Frontend):** Implemented an `isRulerBusy` derived state, disabling all manual action buttons (`Gather Sticks`, `Gather Timber`, `Hunt Rations`, `Help Build`) if any task is currently underway.
## Plot Inspector and Build Menu Enhancements (Jules)
- **Feature Add**: Created a `Plot Inspector` in `frontend/src/App.jsx`. Selecting a developed plot now opens a dedicated panel in the right sidebar (mutually exclusive with Hex and Pop inspectors), showing building type, level (hardcoded to Level 1), and dynamically filtering the simulation engine (`pops`) to list currently assigned Residents and Workers based on their `homeCoords` and `workCoords`.
- **Feature Add**: Updated the `BuildMenu` in React to visually preview building shapes and benefits.
- **Data Change**: Injected a `shape` property into all entries in `STRUCTURES_DB` across both `engine/library.py` and `frontend/src/library.js`.
- **UX Update**: Stripped out non-dark themes from `FLAVORS`, keeping only `swamp` and `dark` (formerly necromancy). Implemented a theme toggle button in the main top header UI to switch between these two terminal-style aesthetics. Fixed corresponding python testing assertions in `test_engine.py` that relied on the removed `icy` theme.
## 2024-05-24 - Fixed Population Engine Mismatched Dependencies Bug
**Learning:** Found and fixed a bug where `usePopulationEngine` arguments in `App.jsx` were mismatched after refactoring `handlePopsMove` away. This effectively passed an unused function into the hook's `unrest` argument, disabling the organic growth immigration math completely.
**Action:** Always verify hook call signatures when updating and refactoring arguments. The mismatch also caused `addLog` to be undefined inside the population loop, leading to missing log events.
## $(date +%Y-%m-%d) - Supply Chain Groundwork
**Agent:** Quartermaster 📦
**Changes:**
- Transformed `production` mappings into distinct `consumes` and `produces` arrays inside `STRUCTURES_DB` to enforce dependency chains.
- Introduced `storage_cap` attributes to key storage structures like `granary`, `lumberyard`, and `supply wagon`.
- Implemented a base storage capacity of 100 for timber, rations, and stone across both engines.
- Refactored the daily tick logic in `App.jsx` and `Engine.py` to calculate dynamic max capacities based on the settlement's infrastructure.
- Replaced the simple additive daily yield with a sequential **Deficit Protocol** loop. Buildings now explicitly check if they can afford their `consumes` requirements; if they fail the check, they do not deduct inputs and do not yield `produces` outputs.
- Applied max storage boundaries using `Math.min(..., maxStorage)` checks to strictly enforce The Storage Bottleneck.
### 🗄️ Midnight Log: State Protection Pass
As The Archivist, I fortified all `localStorage` state initializations in `frontend/src/App.jsx` and `frontend/src/hooks/usePopulationEngine.jsx`. I replaced naive `parseInt` calls with robust `NaN` checks and wrapped all `JSON.parse` calls in `try...catch` blocks, safely injecting missing default properties (like `bedID`, `terrain`, and `gameTime` fields) using the spread operator to ensure absolute forward-compatibility for player save files.

## 2026-04-23 - Date Sync
**Agent:** The Oracle 👁️
**Changes:**
- Verified the system date and synced it across all agent logs to 2026-04-23 to prevent hallucinating dates.

## 2026-04-23 - The Ledger Purge & Implementation
**Agent:** Mason 🧱
**Summary:** Executed a comprehensive cleanup and implementation pass to address long-standing balance issues and player friction.
- Implemented the "Death Spiral" fix: Buildings like "Castle" and "Barracks" now reduce `unrest` by 2 upon completion.
- Adjusted "Sweat Equity" scaling: Manual resource gathering (Timber, Rations, Stone) yields now scale with the current progression stage. "Help Build" yields were previously bumped to `+10` and are viable.
- Purged resolved reports from `BALANCE_LEDGER.md` (Death Spiral, Help Build, Resource Scaling) and `NIGHTWATCH_REPORT.md` (Sweat Equity Trap, Ineffective Help Build).

### Bolt ⚡ - 2026-04-24
- Optimized `usePopulationEngine.jsx` by memoizing dependencies into `useRef`s to prevent `setInterval` stale closures and combined `setGameTime` and `setPops` logic to eliminate nested re-renders. The simulation tick is now much smoother and runs O(N) gracefully.
## 2026-04-24 - Daily Commit Summary
**Agent:** Scribe 📜
**Changes:**
- Reviewed commits for the last 24 hours. The primary update was merging PR #101 by Dave (Muse), which added new atmospheric concepts to the Vibe Ledger.
- Multiple new agent logs, testing scripts (such as `simulate_help_build_optimized.js` and `simulate_death_spiral.js`), and a triage tool (`tools/triage.py`) were committed.
## 2026-04-27
- Merged PR #104: ⚡ Bolt Optimization: Decouple setInterval and memoize dependencies with useRef

## 2026-04-27 - Implement Ledger Blueprints
**Agent:** Mason 🧱
**Changes:**
- Addressed Stage 3 Charter Soft-Lock by updating HOUSING_CAPACITY from 4 to 5 in library.js.
- Addressed Stage 1 to Stage 2 Grind & Clarification by adding visual indicators showing the 5/5 requirement for Timber and Rations in App.jsx.
- Addressed Duplicate Tech Tree Unlocks by conditionally hiding the "Unlock Agriculture" button in the TechTree component if "Agriculture" is already unlocked in App.jsx.
- Cleared the specific items addressed from NIGHTWATCH_REPORT.md and BALANCE_LEDGER.md.
## 2026-04-27 - Date Sync
**Agent:** Scribe 📜
**Changes:**
- Verified the system date and synced it across all agent logs to 2026-04-27 to prevent hallucinating dates.
## 2026-04-26
**Agent:** Mason 🧱
**Changes:**
- Removed soft-locks: Stage 3 charter condition by updating `HOUSING_CAPACITY` and Stage 1 to 2 grind UI indicator.
- Fixed duplicate "Agriculture" technology additions.
### 2026-04-26
- **Bolt ⚡:** Decoupled nested state setters in `usePopulationEngine.jsx` to prevent re-render thrashing, memoized immigration capacity scanning, and fixed stale closures in `App.jsx`'s daily inventory processing using `useRef` tracking.
## 2026-04-26 - Daily Commit Summary
**Agent:** Scribe 📜
**Changes:**
- Reviewed commits for the last 24 hours. The primary update was merging PR #104 by Dave (Bolt), which optimized `usePopulationEngine.jsx` by memoizing dependencies with `useRef` to decouple `setInterval` from React render cycles.
- Synced `STATE_MACHINE.md` to reflect actual `stage` conditional logic accurately based on codebase reality.
### 2026-04-25
**Bolt ⚡:** Optimized the `useEffect` intervals in `frontend/src/App.jsx` and `frontend/src/hooks/usePopulationEngine.jsx`.
1. Fixed massive synchronous re-render thrashing caused by nested React state setters inside the background tick intervals (`setGameTime(prev => { setPops(prevPops => ...) })`).
2. Replaced the stale closures in intervals with `useRef` tracked state variables (`gameTimeRef`) which are updated instantaneously.
3. Both `App.jsx` and `usePopulationEngine.jsx` now compute their logic inside the interval on un-batched references, bypassing the need to constantly trigger complex re-renders just to get the current time or state.
## 2026-04-25 - Date Sync
**Learning:** The correct system date is 2026-04-25.
**Action:** Use 2026-04-25 for all generated reports and logs in this session.


### 🦉 Nightwatch & Quartermaster Patch - 2026-04-27

#### 🦉 Nightwatch Code

```javascript
// From tests/bot.js
            let currentStage = 0;
            if (stageText.includes("A small comfort in the dark")) currentStage = 1;
            if (stageText.includes("Camp established at (5,5)")) currentStage = 2;
            if (stageText.includes("Citizens arrive and build houses") || stageText.includes("The Kingdom expands!")) currentStage = 3;
            if (stageText.includes("The Charter is signed")) currentStage = 4;
            telemetry.stageReached = Math.max(telemetry.stageReached, currentStage);

// ACTION_PRIORITIES[2] updates
        { selector: 'button:has-text("Residential")', weight: 1.0 },
        { selector: 'button:has-text("Houses")', weight: 2.0 },

// ACTION_PRIORITIES[3] updates
    3: [
        { selector: 'button:has-text("Gather Timber")', weight: 1.0 },
        { selector: 'button:has-text("Hunt Rations")', weight: 1.0 },
        { selector: 'button:has-text("Gather Stone")', weight: 1.0 },
        { selector: 'button:has-text("Help Build")', weight: 1.5 },
        { selector: 'button[aria-label="Settlement Cell"]:has-text("[ ]")', weight: 0.5 },
        { selector: 'button.bg-green-900:has-text("Build")', weight: 2.0 },
        { selector: 'button[aria-label="Close build menu"]', weight: 0.1 },
        { selector: 'button:has-text("Industry")', weight: 1.0 },
        { selector: 'button:has-text("Pier")', weight: 1.0 },
        { selector: 'button:has-text("Sawmill")', weight: 1.0 },
        { selector: 'button:has-text("Sign the Charter")', weight: 5.0 }
    ]
```

#### 📦 Quartermaster Code

```javascript
// tests/simulate_production.js
import { STRUCTURES_DB } from '../frontend/src/library.js';

const startingResources = {
    timber: 5,
    lumber: 0,
    rations: 0,
    stone: 0
};

// "Mock a kingdom state with 1 Pier and 1 Sawmill"
const structureCounts = {
    "sawmill": 1, // 1 cell = 1 sawmill
    "pier": 1        // 1 cell = 1 pier
};

let maxTimber = 100;
let maxLumber = 100;
let maxRations = 100;
let maxStone = 100;

Object.entries(structureCounts).forEach(([structName, cellCount]) => {
    const structData = STRUCTURES_DB[structName];
    if (structData && structData.storage_cap) {
        const lots = structData.lots || 1;
        const actualCount = Math.floor(cellCount / lots);
        for (let i = 0; i < actualCount; i++) {
            if (structData.storage_cap.timber) maxTimber += structData.storage_cap.timber;
            if (structData.storage_cap.lumber) maxLumber += structData.storage_cap.lumber;
            if (structData.storage_cap.rations) maxRations += structData.storage_cap.rations;
            if (structData.storage_cap.stone) maxStone += structData.storage_cap.stone;
        }
    }
});

let resources = { ...startingResources };

console.log("=== 📦 Quartermaster Production Simulation ===");
console.log(`[Start] Timber: ${resources.timber}/${maxTimber}, Lumber: ${resources.lumber}/${maxLumber}, Rations: ${resources.rations}/${maxRations}, Stone: ${resources.stone}/${maxStone}`);

for (let tick = 1; tick <= 24; tick++) {
    let dailyTimber = 0;
    let dailyLumber = 0;
    let dailyRations = 0;
    let dailyStone = 0;

    Object.entries(structureCounts).forEach(([structName, cellCount]) => {
        const structData = STRUCTURES_DB[structName];
        if (structData) {
            const lots = structData.lots || 1;
            const actualCount = Math.floor(cellCount / lots);
            for (let i = 0; i < actualCount; i++) {
                let canProduce = true;

                if (structData.consumes) {
                    if (structData.consumes.timber && resources.timber + dailyTimber < structData.consumes.timber) canProduce = false;
                    if (structData.consumes.lumber && resources.lumber + dailyLumber < structData.consumes.lumber) canProduce = false;
                    if (structData.consumes.rations && resources.rations + dailyRations < structData.consumes.rations) canProduce = false;
                    if (structData.consumes.stone && resources.stone + dailyStone < structData.consumes.stone) canProduce = false;
                }

                if (canProduce) {
                    if (structData.consumes) {
                        if (structData.consumes.timber) dailyTimber -= structData.consumes.timber;
                        if (structData.consumes.lumber) dailyLumber -= structData.consumes.lumber;
                        if (structData.consumes.rations) dailyRations -= structData.consumes.rations;
                        if (structData.consumes.stone) dailyStone -= structData.consumes.stone;
                    }

                    const produces = structData.produces || structData.production;
                    if (produces) {
                        if (produces.timber) dailyTimber += produces.timber;
                        if (produces.lumber) dailyLumber += produces.lumber;
                        if (produces.rations) dailyRations += produces.rations;
                        if (produces.stone) dailyStone += produces.stone;
                    }
                }
            }
        }
    });

    resources.timber = Math.min(Math.max(0, resources.timber + dailyTimber), maxTimber);
    resources.lumber = Math.min(Math.max(0, resources.lumber + dailyLumber), maxLumber);
    resources.rations = Math.min(Math.max(0, resources.rations + dailyRations), maxRations);
    resources.stone = Math.min(Math.max(0, resources.stone + dailyStone), maxStone);
}

console.log(`[End]   Timber: ${resources.timber}/${maxTimber}, Lumber: ${resources.lumber}/${maxLumber}, Rations: ${resources.rations}/${maxRations}, Stone: ${resources.stone}/${maxStone}`);

const netTimber = resources.timber - startingResources.timber;
const netLumber = resources.lumber - startingResources.lumber;
const netRations = resources.rations - startingResources.rations;
const netStone = resources.stone - startingResources.stone;

console.log("\n[Daily Yield]");
console.log(`Timber:  ${netTimber > 0 ? '+' : ''}${netTimber}`);
console.log(`Lumber:  ${netLumber > 0 ? '+' : ''}${netLumber}`);
console.log(`Rations: ${netRations > 0 ? '+' : ''}${netRations}`);
console.log(`Stone:   ${netStone > 0 ? '+' : ''}${netStone}`);
```
