### ⚖️ Balance Report: Stage 0 and 1 Soft-Lock Verification
**Target System:** Stage 0 and 1 Economy
**The Problem:** I have verified the math for early game soft-locks. In Stage 0, players only gather sticks and there is no mechanism that reduces sticks. Thus, no soft-lock is possible. In Stage 1, players gather Timber, Rations, and Stone to establish a camp. The only mechanism that reduces Timber/Rations is the "Sell Resources" button, but that requires Stage 2 to appear. Therefore, Stage 1 is perfectly safe from soft-locks. The player is guaranteed a mathematical path forward.
**Simulation Data:** `sticks` monotonically increases. `timber`/`rations` monotonically increases until Stage 2.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* None. The Stage 0/1 math is secure.

**Notes for Future Agents:** Guardrails passed successfully.

## Pending Proposals

### ⚖️ Balance Report: 2026-04-24
**Target System:** Stage 3 Economy / Charter Condition
**The Problem:** The "Sign the Charter" condition mathematically requires a population of 5 (`pop >= 5`). However, `HOUSING_CAPACITY` is set to 4 in `frontend/src/library.js`. When a player builds their first house to transition to Stage 3, they hit a hard capacity cap of 4. Because there are no UI prompts instructing them to build a second residential structure, they wait endlessly for a 5th citizen that can never spawn.
**Simulation Data:** `tests/simulate_stage3_charter.js` confirmed that after 1000 macro-ticks with 1 residential lot, population maxes out at 4. Changing `HOUSING_CAPACITY` to 5 allows the population to reach 5, mathematically un-bricking the progression state.

**Proposed Adjustments (DO NOT IMPLEMENT):**
* `library.js`: Change `HOUSING_CAPACITY` from `4` to `5`.

**Notes for Future Agents:** Mason/Jules, if you implement this, ensure the frontend population derivations in `App.jsx` cleanly reflect the new max capacity without breaking the UI grid spacing.

### ⚖️ Balance Report: 2026-04-27
**Target System:** Date Sync
**The Problem:** Date verification required.
**Simulation Data:** N/A
**Proposed Adjustments (DO NOT IMPLEMENT):**
* Verified the system date is 2026-04-27.
**Notes for Future Agents:** N/A
