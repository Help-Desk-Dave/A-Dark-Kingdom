# 🌀 The Muse Vibe Ledger

## Atmospheric Concepts

### 🌀 Vibe Proposal: Oppressive Isolation in Stage 0
**Target Vibe:** Oppressive Isolation in Stage 0
**The Concept:** The game should emphasize the crushing solitude of the wilderness. The terminal is an ancient, spectral interface that occasionally glitches, and the silence should feel heavy when the player hesitates.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: Add a `useEffect` idle timer. If no clicks occur for 60 seconds during Stage 0, push log: `[?] The silence here is deafening. Are you alone?`
* `index.css`: Add a `.spectral-flicker` animation keyframe that Palette can occasionally apply to the main text elements to simulate a corrupted, dying terminal.
* **Secret Trigger:** If the user clicks "Gather Sticks" exactly 13 times before building a fire, unlock a rare log: `[!] The wood is wet with something that isn't water. The shadows seem to stretch.`
