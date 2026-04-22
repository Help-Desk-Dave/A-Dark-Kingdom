# 🦉 NIGHTWATCH REPORT

### 🐛 Friction Report: The Stage 3 Charter Soft-Lock (Macro-Flow Dead Zone)
**Delegated To:** @Quartermaster 📦 / @Scribe 📜
**Steps to Reproduce:**
1. Progress to Stage 2 and construct `houses` to trigger the start of Stage 3.
2. Observe the stage transition and wait for population growth or further instructions.
3. The "Sign the Charter" button condition checks if the kingdom's housing capacity is >= 5: `pop >= 5` where `pop = resLots * HOUSING_CAPACITY`.
4. Since `HOUSING_CAPACITY` is 4, one set of houses only provides 4 capacity.
5. The player is soft-locked because there is no visual prompt or objective instructing them to build a second residential structure to reach 5 capacity.
**The Friction:** The player hits a complete macro-flow dead zone. The game expects them to intuitively know they must build a second residential structure to raise the capacity to 5, but provides no visual hint, UI objective, or ledger prompt. They will sit staring at the screen waiting for a 5th citizen that mathematically cannot spawn, effectively soft-locking their playthrough.
**Expected Fix:** Either lower the Charter requirement to 4 capacity, increase base `HOUSING_CAPACITY` to 5, or add a persistent UI hint during Stage 3 that explicitly states "Build additional housing to increase capacity to 5."

### 🐛 Friction Report: The "Sweat Equity" Trap (Heavy Rep Metric)
**Delegated To:** @Equinox ⚖️
**Steps to Reproduce:**
1. Reach Stage 2 where the Ruler's Actions menu is unlocked.
2. Attempt to use the "Sell Resources (10 Timber, 10 Rations -> 1 BP)" action.
3. Realize that gathering 10 Timber and 10 Rations requires clicking manual actions 20 times.
4. Factor in the `ProgressBar` intervals: Gathering takes 50ms * 100 ticks (5 seconds per action).
**The Friction:** To earn a single Build Point (BP) manually, a player is forced into over 100 seconds of real-time locked progression grinding, not even factoring in the Ruler's `failMod` which can void the action entirely. Trying to afford a 5 BP Reconnoiter or 10 BP Claim through manual labor requires 500-1000 seconds of pure clicking, creating massive player fatigue.
**Expected Fix:** Rebalance the BP exchange rate (e.g., sell 5/5 for 2 BP), significantly decrease the duration of manual gathering loops, or provide a flat lump-sum BP reward upon reaching Stage 3 to alleviate the early-game scarcity.

### 🐛 Friction Report: Ineffective "Help Build" Action
**Delegated To:** @Equinox ⚖️
**Steps to Reproduce:**
1. Queue a structure in the construction menu.
2. Observe the passive construction loop, which automatically adds +1 progress per second.
3. Click the "Help Build" ruler action.
4. Wait 5 seconds for the `isHelpingBuild` progress bar to complete.
**The Friction:** The "Help Build" action locks the ruler out of all other actions for 5 full seconds to grant a meager +2 progress. Mathematically, this equates to 0.4 progress/second—slower than the automated builders. If the `failMod` triggers, the player wastes 5 seconds for 0 progress. It feels completely unrewarding and mechanically irrelevant.
**Expected Fix:** Drastically increase the "Help Build" progress bump (e.g., +10 progress) so the player's direct intervention feels impactful, or change it to immediately shave off a percentage of the remaining construction time.
