# 🌀 The Muse Vibe Ledger

## Atmospheric Concepts

### 🌀 Vibe Proposal: 2026-04-27/Flickering Hope
**Target Vibe:** The flickering hope and creeping darkness in Stage 1.
**The Concept:** When the player establishes a fire but remains idle, the light should feel fragile against the oppressive dark of the swamp.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: Add an idle timer in Stage 1. If no clicks occur for 45 seconds, push log: `[?] The fire sputters. The shadows inch closer.`
* `index.css`: Add a `.flicker-die` keyframe to make the fire icon dim occasionally.
* **Secret Trigger:** If the user clicks the fire icon exactly 7 times while idle, unlock a rare log: `[!] Sparks fly. You see a face in the flames for a fraction of a second.`

### 🌀 Vibe Proposal: 2026-04-27/The Vast Dark
**Target Vibe:** The daunting realization of a larger, hostile world when reaching Stage 4.
**The Concept:** Opening the world map shouldn't just be a mechanical UI change; it should feel like standing on a precipice. The world is vast, murky, and unforgiving.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: When `stage` transitions to 4, pause for 1 second and push log: `[!] The fog parts slightly. The world is vast, and you are very small.`
* `index.css`: Add a `.map-reveal-creep` animation keyframe to make the map grid slowly fade in from the edges, as if clearing away dark mist.
* **Secret Trigger:** If the user clicks the center of the world map 5 times immediately after it opens, unlock log: `[?] A drop of black ink bleeds across the parchment.`

### 🌀 Vibe Proposal: 2026-04-27/The Swamp Reclaims
**Target Vibe:** The inevitable decay of the swamp claiming hoarded wealth.
**The Concept:** If the player gathers resources but hoards them endlessly without building, the atmosphere should imply that the damp rot of the environment is setting in.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: If a resource like `timber` or `rations` remains unspent for over 2 minutes, occasionally push log: `[*] The damp rot spreads. What you hoard, the swamp reclaims.`
* `index.css`: Add a `.rot-text` animation keyframe that applies a subtle brownish-green tinge to the stagnant resource counter.
* **Secret Trigger:** If the user clicks a stagnant resource exactly 13 times, unlock log: `[!] You wipe away the mold, but it grows back as you watch.`

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
### 🎨 Vibe Proposal: 2026-04-21 / Defending Atmosphere

**Target Vibe:**
A sense of unseen danger and constant tension from the swamp, addressing the lack of a true 'defending' mechanic in the UI.

**The Concept:**
While `docs/Rules.md` mentions 'defending', 'ruling', and 'building', the game currently only features explicit UI states for building and ruling (Advisors/Unrest). We can inject 'defending' flavor atmospherically via the Event Log. Unrest shouldn't just be a number; it should feel like you are actively defending the kingdom from internal mutiny and external swamp terrors.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
- **Secret Trigger:** If `unrest > 0` and it's night time (`gameTime.hour > 20 || gameTime.hour < 5`), randomly append atmospheric Event Logs such as `[!] Shadowy figures stalk the perimeter of the camp.` or `[*] The militia repels a swarm of giant mosquitoes.`
- **Easter Egg:** A 1% chance on `handleHuntRations` to trigger a purely cosmetic log: `[!] Your hunters return empty-handed, speaking of glowing eyes in the mangroves.`
- These logs should be purely visual and NEVER alter raw resources or block core progression actions.

### 🌀 Vibe Proposal: 2026-04-24/Building Collapse
**Target Vibe:** The oppressive fragility of progress.
**The Concept:** When a building finishes constructing, sometimes the swamp fights back, giving a sense that the structures are barely holding on in the muck.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: When a job completes, if `stage === 1`, add a 2% chance to push a rare log: `[!] The new timbers sink inches into the mud before settling. For now.`
* `index.css`: Add a `.settle-mud` animation keyframe that Palette can apply to newly completed structure UI components, making them briefly shake downwards.
* **Secret Trigger:** If the user clicks on a newly completed building 5 times within 10 seconds of completion, unlock a rare log: `[!] Stop shaking it. The foundations are weak enough.`

### 🌀 Vibe Proposal: 2026-04-24/Advisor Despair
**Target Vibe:** The psychological toll of ruling the dark.
**The Concept:** The advisors shouldn't just be mechanical cogs; they are living in this nightmare too. Over time, their demeanor should crack if unrest is high.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: If `unrest > 50` and the user opens the Advisor panel, push a rare log: `[?] The advisors avoid your gaze. They whisper when you look away.`
* `index.css`: Add a `.flicker-shadow` keyframe animation that occasionally applies a dark text shadow to the advisor names when `unrest > 50`, as if the light in the room is failing.
* **Secret Trigger:** If the user assigns and unassigns the same advisor 3 times in a row, unlock a rare log: `[!] "We serve, my liege," they say. But their voices are hollow.`

### 🌀 Vibe Proposal: 2026-04-24/The Witching Hour
**Target Vibe:** The terror of the true dark.
**The Concept:** The game time cycle shouldn't just change the resource tick; night time should feel palpably more dangerous and isolating, even if no actual danger exists mechanically.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: During the in-game night (`gameTime.hour === 2` specifically), push a rare log: `[*] A strange mist rolls in from the swamps. The borders feel very close.`
* `index.css`: Add a `.vignette-creep` keyframe that Palette can apply to the main app container, slowly increasing a dark edge vignette around the screen between 1 AM and 3 AM in-game.
* **Secret Trigger:** If the user clicks on the time display exactly at `00:00` (midnight), unlock a rare log: `[!] The clock strikes. Something in the swamp strikes back.`

### 🌀 Vibe Proposal: 2026-04-27
**Target Vibe:** Date Sync
**The Concept:** Verified the system date is 2026-04-27.
**Implementation Details (DO NOT IMPLEMENT DIRECTLY):** N/A
### 🌀 Vibe Proposal: 2026-04-26/Unearthed Secrets
**Target Vibe:** The oppressive, ancient nature of the earth.
**The Concept:** Gathering stone shouldn't just be picking up rocks, it should feel like unearthing things best left buried in the dark soil.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: On `handleGatherStone` completion, add a 2% chance to push a rare log: `[!] The stone you unearthed is carved with runes that hurt your eyes. You drop it back into the muck.`
* `index.css`: Add a `.shatter-dust` animation keyframe for the stone gather progress bar, making it occasionally dissolve into ash on completion.
* **Secret Trigger:** If the user clicks `Gather Stone` exactly 7 times in a row without gathering anything else, unlock a rare log: `[!] The earth groans under your constant digging. It wants to sleep.`

### 🌀 Vibe Proposal: 2026-04-26/Illusion of Safety
**Target Vibe:** The fragile illusion of safety upon reaching Stage 2.
**The Concept:** Building the first houses gives a false sense of security. The structures are frail in a hostile, swallowing environment.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: When `stage` transitions from 1 to 2, push a log: `[*] Walls of timber and mud rise from the swamp. They won't keep the dark out, but they hide you from it.`
* `index.css`: Add a `.flicker-candle` animation for the settlement grid UI elements, simulating weak firelight struggling against encroaching darkness.
* **Secret Trigger:** If the user idles for 120 seconds immediately after reaching Stage 2, unlock a rare log: `[?] Something scratches against the outside of your new walls.`

### 🌀 Vibe Proposal: 2026-04-26/Swamp Reclamation
**Target Vibe:** The vast, uncharted horrors of the murky wilderness.
**The Concept:** Expanding the map into Swamp tiles isn't just uncovering terrain; it's pushing into hostile, diseased territory that resents your presence.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: When a user recons or claims a `Swamp` tile in the `WorldGrid`, add a 5% chance to push a rare log: `[!] The murky waters here are choked with strange, pale roots. The air smells of copper.`
* `index.css`: Add a `.murk-reveal` transition for newly revealed swamp tiles, making them appear slowly from blackness rather than snapping into view.
* **Secret Trigger:** If the user clicks the same unexplored map tile 5 times rapidly, unlock a rare log: `[!] Stop staring into the fog. It's starting to stare back.`
### 🌀 Vibe Proposal: 2026-04-25 / The Deep Quarry
**Target Vibe:** The oppressive, suffocating atmosphere of digging into the cursed earth.
**The Concept:** When the player gathers stone, it shouldn't just feel like mining; it should feel like unearthing something that was buried for a reason.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: When `gatherStoneProgress` completes, add a 1% chance to push a rare log: `[!] The stone is cold, and smells faintly of dried blood. You struck something metallic.`
* `index.css`: Add a `.stone-dust` animation keyframe that Palette can apply to the main screen, creating a subtle grey vignette that fades in and out while `isGatheringStone` is true.
* **Secret Trigger:** If the user clicks "Gather Stone" 7 times in a row without doing any other action, unlock a rare log: `[!] You dig deeper. The echoes from the quarry don't sound like pickaxes anymore.`

### 🌀 Vibe Proposal: 2026-04-25 / Debt and Despair
**Target Vibe:** The creeping dread of a failing economy.
**The Concept:** The game notes `[!] Debt causes unrest!`. The player should feel the weight of this debt, not just as numbers, but as the palpable anger and despair of a ruined kingdom.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: If `bp < 0` (debt) and the user opens the Ledger, push a rare log: `[?] The ledger is covered in angry, scrawled threats. They demand their due.`
* `index.css`: Add a `.debt-tremor` keyframe animation that slightly shakes the BP counter and turns it a rusted, dried-blood red when BP is negative.
* **Secret Trigger:** If the user attempts to construct a building while in debt and fails due to lack of BP, unlock a rare log: `[!] The workers throw down their tools. "We don't work for empty promises," they spit.`

### 🌀 Vibe Proposal: 2026-04-25 / The Endless Rain (Idle State)
**Target Vibe:** The crushing stagnation of the swamp when left alone.
**The Concept:** If the player stops interacting, the swamp begins to reclaim the UI. It shouldn't feel like a pause; it should feel like abandonment.

**Implementation Details (DO NOT IMPLEMENT DIRECTLY):**
* `App.jsx`: Add a `useEffect` idle timer. If no clicks occur for 180 seconds, push log: `[?] The rain begins to fall, washing away the tracks in the mud. The settlement feels very small.`
* `index.css`: Add a `.swamp-rot` animation keyframe that Palette can apply to the main app container, slowly desaturating the UI colors the longer the player is idle.
* **Secret Trigger:** If the user returns from idle after 5 minutes and immediately clicks a "Gather" action, unlock a rare log: `[!] The mud is thicker than before. It remembers you.`
