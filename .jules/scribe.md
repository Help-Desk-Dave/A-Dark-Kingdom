# Scribe Journal
## 2024-04-20 - [Synced STATE_MACHINE with current game state]
**Learning:** The UI progression state machine frequently drifts, especially around transitions, because mechanics are simplified over time and specific checks shift logic layers. State machine transitions must be documented with explicit variable conditions from the code rather than broad narrative descriptions to remain accurate and helpful.
**Action:** Always search the codebase for literal variables and thresholds, rather than relying on textual summaries, and use explicit markdown conditions when documenting states.
## 2026-04-21 - [Stage Machine Misalignment Discovered]
**Learning:** The game's background tick simulation is paused in Stage 2 (via `if (stage < 3 || showHeroSelection) return;`) despite older documentation claiming it started then. Additionally, new UI buttons like `[Gather Stone]` and features like the Tech Tree were added without updating the visual states in STATE_MACHINE.md.
**Action:** When auditing the State Machine, explicitly verify the conditional returns inside the `useEffect` intervals in `App.jsx` rather than trusting narrative summaries, and check the conditional rendering blocks (e.g., `stage === 1`) for newly added React components.

## 2026-04-23 - Date Sync
**Learning:** The correct system date is 2026-04-23.
**Action:** Use 2026-04-23 for all generated reports and logs in this session.
## 2026-04-21 - Documenting explicit UI transitions
 **Learning:** I learned that documentation like STATE_MACHINE.md can drift from the codebase if explicit variable conditions aren't used. I noticed `WorldGrid.jsx` checked for `stage >= 3` to allow interactions, but `App.jsx` conditionally renders `WorldGrid` only when `stage >= 4`. I also verified exact conditions from `App.jsx` like `sticks >= 10` and `!(timber < 5 || rations < 5)` for transitions.
 **Action:** Next time, I will read the specific codebase logic and use exact variable states when documenting state machine transitions to avoid descriptive narrative that can become out of sync.

## 2026-04-27 - Date Sync
**Learning:** The correct system date is 2026-04-27.
**Action:** Use 2026-04-27 for all generated reports and logs in this session.
