State Machine Reference (UI Progression)

"A Dark Kingdom" relies on a strict progressive disclosure state machine. The stage integer controls what UI elements are rendered and what background loops are running. Agents must not break this sequence.

Stage 0: The Wilderness

Visuals: Entire screen is black/hidden except for the Event Log and a single action button: [Gather Sticks].

Logic: The background simulation tick is Paused. No resources drain.

Transition: After 10 sticks are gathered, unlock [Build Fire]. Clicking it transitions to Stage 1.

Stage 1: Survival Mode

Visuals: Basic manual gathering column appears ([Gather Timber], [Hunt Rations]).

Logic: The background simulation tick is Paused. The player must manually gather to survive.

Transition: Clicking [Establish Camp] reveals the central map area (locked to coordinate 5,5) and transitions to Stage 2.

Stage 2: The First Companions

Visuals: Settlement Map (5x5 grid) is revealed.

Logic: The 5-second tickCount simulation Begins. Rations begin to drain based on population. The player can construct basic survival structures (Tents, Wagons).

Transition: Once population capacity expands via tents and citizens arrive, transition to Stage 3.

Stage 3: Automation & Expansion

Visuals: Worker assignment UI is revealed.

Logic: Players can assign Pops to roles (Woodcutter, Trapper) to automate resource generation.

Transition: Once the population reaches a threshold (e.g., Pop >= 5) and a Scouting Map is crafted, the [Sign the Charter] button appears. Clicking it transitions to Stage 3.5.

Stage 3.5: Hero Selection (Intermediate State)

Visuals: A modal overlay obscures the screen, presenting Brevic Backgrounds.

Logic: The 5-second tickCount simulation is explicitly Paused. Rations/Timber do not drain while the player reads lore.

Transition: Selecting a background applies the stats to the Ruler and transitions to Stage 4.

Stage 4: The Dark Kingdom

Visuals: Full UI is unlocked. The 10x10 World Map is revealed. The Kingdom Ledger is fully visible.

Logic: Simulation tick Resumes. The economy shifts. Build Points (BP), Unrest, and Kingdom XP mechanics are fully active.
