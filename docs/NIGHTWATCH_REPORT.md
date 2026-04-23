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

