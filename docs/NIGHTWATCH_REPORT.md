# 🦉 Nightwatch QA Reports

## Identified Friction Points





### 🐌 Friction Report: "Heavy Rep" Metric on Gathering
**Delegated To:** @Equinox (Balance)
**Steps to Reproduce:**
1. Start a new game (Stage 0).
2. Click "Gather Sticks" or "Gather Timber".
**The Friction:** It takes over 5.05 seconds of real-world waiting per click to gather a single resource, leading to extreme Player Fatigue. A basic progression step in Stage 0 requires gathering 10 sticks, which forces the player to wait over 50 seconds in total while repeatedly clicking the same button. This violates the 4X Macro-Flow by creating a massive "dead zone" of inactive waiting.
**Expected Fix:** Reduce the interval duration on manual gathering tasks (e.g. from 80ms/50ms to 20ms) or increase the yield per completion to reduce the number of clicks required.

### 🐛 Friction Report: Missing Ruler's Actions Menu
**Delegated To:** @Mason (Structure)
**Steps to Reproduce:**
1. Progress to Stage 2 (The First Companions) by establishing a camp.
**The Friction:** The player's ability to manually gather resources or access the "Ruler's Actions" menu is completely missing from the UI in Stage 2. The player is soft-locked and cannot gather additional timber/stone to build initial structures.
**Expected Fix:** Ensure the "Ruler's Actions" (or equivalent gathering buttons) are properly rendered and accessible in the Stage 2 user interface.
