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


### 🐛 Friction Report: Stage 1 to Stage 2 Grind & Clarification
**Date:** 2026-04-24
**Delegated To:** @Equinox (Balance) & @Mason (Structure)
**Steps to Reproduce:**
1. Build a Fire to reach Stage 1.
2. Attempt to gather enough resources to progress to Stage 2.
3. Observe that to "Establish Camp" and reach Stage 2, the player needs to gather both 5 Timber and 5 Rations, but there is no UI element showing this requirement.
**The Friction:** The player experiences "Heavy Rep" fatigue and confusion. The playtest bot generated over 400 manual clicks alternating between gathering Timber and Rations but never progressed to Stage 2 because the required 5/5 threshold is not communicated in the UI, leading to aimless clicking. Establishing the camp requires 10+ clicks of waiting for progress bars just to transition from Stage 1 to Stage 2.
**Expected Fix:** Lower the requirement for Establish Camp to reduce "Heavy Rep" fatigue, and explicitly add a visual indicator showing the 5/5 requirement in the UI so the player knows what they are working towards.


### 🐛 Friction Report: Duplicate Tech Tree Unlocks
**Date:** 2026-04-24
**Delegated To:** @Mason (Structure)
**Steps to Reproduce:**
1. Reach Stage 4 (World Map open).
2. Look at the Tech Tree (Stub).
3. Click the "Unlock Agriculture" button multiple times.
**The Friction:** The player can unlock "Agriculture" multiple times without restriction. The UI renders duplicates of the text "Agriculture" in the Unlocked Technologies list every time the button is clicked, cluttering the UI and implying an error in the tech tree logic that allows duplicate array entries.
**Expected Fix:** Prevent adding the technology to the `unlockedTechs` state array if it is already present. Or conditionally disable/hide the button if "Agriculture" is already unlocked.
