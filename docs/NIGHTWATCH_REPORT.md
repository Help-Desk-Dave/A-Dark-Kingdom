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
### 🐞 Friction Report: Stage 1 Timber Gathering Fatigue (The Heavy Rep)
**Date:** 2026-04-27
**Delegated To:** @Equinox & @Palette
**Steps to Reproduce:**
1. Run `tests/bot.js` playtest.
2. Observe behavior in Stage 1.
3. The bot exclusively hunts for Rations, reaching over 128 Rations but generating 0 Timber and 0 Sticks.
4. It encounters 449 failures out of 500 actions taken due to action weights and missing visual cues/feedback for the "Gather Timber" priority in stage 1, making progression completely stale.
**The Friction:** The player's journey stalls at Stage 1. The bot's "brain" favors clicking "Hunt Rations" because the `weight` mapping makes it accessible, but the constant hunting without switching to "Gather Timber" implies the player is stuck grinding rations with no indication or affordance pushing them to accumulate the timber needed to progress to Stage 2 (Establish Camp). This is a severe "Macro-Flow" dead zone and represents massive "Player Fatigue" with repetitive actions that yield no advancement.
**Expected Fix:**
- @Equinox: Rebalance resource requirements or provide passive generation so timber isn't entirely dependent on manual grinding, or scale manual yields so the "Heavy Rep" feels less punishing.
- @Palette: Enhance UI feedback to signal when a resource is capped or when another resource (Timber) is strictly required to progress (Establish Camp).

### 🐞 Friction Report: 2026-04-27 Date Sync
**Delegated To:** @Scribe
**Steps to Reproduce:**
1. Check system date
2. Update the date across logs
**The Friction:** Date could be hallucinated if not synced.
**Expected Fix:** Update logs to use 2026-04-27.
### 🐛 Friction Report: Stage 1 to Stage 2 Clarification
**Date:** 2026-04-25
**Delegated To:** @Palette 🎨 & @Equinox (Balance)
**Steps to Reproduce:**
1. Build a Fire to reach Stage 1.
2. Attempt to gather enough resources to progress to Stage 2.
3. Observe that to "Establish Camp" and reach Stage 2, the player needs to gather both 5 Timber and 5 Rations, but there is no UI element showing this requirement.
**The Friction:** The player experiences confusion because the 5/5 threshold for Timber and Rations to establish a camp is hidden. The playtest bot blindly hoarded one resource (182 Rations, 0 Timber) in an initial run, failing to progress because it didn't know the requirements. Progression relies on blind guessing or accidentally gathering enough of both resources.
**Expected Fix:** Explicitly add a visual indicator showing the 5/5 requirement in the UI so the player knows what they are working towards, and consider lowering the threshold to reduce grind.
### 🐞 Friction Report: Stage 1 Heavy Rep Fatigue (2026-04-26)
**Delegated To:** @Equinox
**Steps to Reproduce:**
1. Progress to Stage 1.
2. Attempt to gather resources by clicking "Hunt Rations".
**The Friction:** The telemetry data shows 436 failed actions out of 499 ticks. The bot repeatedly clicks "Hunt Rations" but spends ~87% of its time idling and failing to act because the action button is disabled while the progress bar fills. This creates extreme "Heavy Rep" fatigue where manual labor feels overly punishing and tedious due to the constant wait times.
**Expected Fix:** Adjust the cooldowns or progress bar durations for manual gathering tasks to reduce idle friction, or increase resource yields to lower the total number of clicks required.
