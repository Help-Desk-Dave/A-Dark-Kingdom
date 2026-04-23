# 🌀 The Muse Vibe Ledger

## Atmospheric Concepts

### 🌀 Vibe Proposal: Oppressive Isolation in Stage 0
**Target Vibe:** Oppressive Isolation in Stage 0
**The Concept:** The game should emphasize the crushing solitude of the wilderness. The terminal is an ancient, spectral interface that occasionally glitches, and the silence should feel heavy when the player hesitates.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: Add a `useEffect` idle timer. If no clicks occur for 60 seconds during Stage 0, push log: `[?] The silence here is deafening. Are you alone?`
* `index.css`: Add a `.spectral-flicker` animation keyframe that Palette can occasionally apply to the main text elements to simulate a corrupted, dying terminal.
* **Secret Trigger:** If the user clicks "Gather Sticks" exactly 13 times before building a fire, unlock a rare log: `[!] The wood is wet with something that isn't water. The shadows seem to stretch.`

### 🌀 Vibe Proposal: 2026-04-21/Population Milestone 100
**Target Vibe:** The chaotic murmur of a growing city in Stage 3.
**The Concept:** The settlement is no longer a quiet outpost; it's a claustrophobic, spectral hive. The terminal interface should briefly struggle to process the noise of 100 souls, manifesting as visual static and overlapping whispers in the logs.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: Add a milestone listener. When population hits exactly 100, pause the game simulation for 2 seconds and push log: `[!] The silence breaks. 100 voices whispering at once in the murky dark.`
* `index.css`: Add a `.ghosting-text` keyframe animation for a subtle text-shadow duplication effect that Palette can apply to the population counter for 10 seconds.
* **Secret Trigger:** If the user clicks the population counter 3 times while it reads exactly 100, unlock a rare log: `[?] Who are they talking to?`

### 🌀 Vibe Proposal: 2026-04-21/Critical Unrest
**Target Vibe:** The suffocating dread of impending societal collapse.
**The Concept:** As Unrest reaches critical levels, the settlement should feel like a powder keg ready to explode. The UI should subtly reflect the tension, becoming visually unstable, and the event logs should echo the desperation of the populace.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: Add an effect that triggers when Unrest exceeds 90%. Occasionally push a rare log: `[!] The murmurs in the dark have turned to screams. They are watching you.`
* `index.css`: Add a `.pulse-dread` keyframe animation that slightly reddens and shakes the Unrest meter when it crosses 90%, creating a sense of urgency and danger.
* **Secret Trigger:** If the user attempts to construct a building while Unrest is above 95%, do not block construction but unlock a rare log: `[!] The workers build, but their eyes are hollow. The tools are stained.` and apply a `.glitch` effect to the building preview for a moment.

### 🌀 Vibe Proposal: 2026-04-23/Starvation State
**Target Vibe:** The hollow desperation of a starving populace.
**The Concept:** When the settlement runs out of rations but still has citizens, the UI should reflect the gnawing hunger and failing strength of the people. The numbers shouldn't just be zero; they should feel cold and empty.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: Add a `useEffect` that triggers when `rations === 0` and `totalPop > 0`. Occasionally push a rare log: `[!] The larder is empty. Stomachs growl in the dark.`
* `index.css`: Add a `.hollow-text` animation keyframe that makes the Rations counter text flicker slightly transparent and pale grey when at 0, as if fading away.
* **Secret Trigger:** If the user attempts to "Hunt Rations" 5 times while `rations === 0` and fails each time (due to `failMod`), unlock a rare log: `[!] There is nothing left out here. Only bones.`
