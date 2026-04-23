State Machine Reference (UI Progression)

"A Dark Kingdom" relies on a strict progressive disclosure state machine. The stage integer controls what UI elements are rendered and what background loops are running. Agents must not break this sequence.

Stage 0: The Wilderness

Visuals: Entire screen is black/hidden except for the Event Log and a single action button: [Gather Sticks].

Logic: The background simulation tick is Paused. No resources drain.

Transition: After `sticks >= 10`, unlock [Build Fire]. Clicking it transitions to Stage 1.

Stage 1: Survival Mode

Visuals: Basic manual gathering column appears ([Gather Timber], [Hunt Rations], [Gather Stone]).

Logic: The background simulation tick is Paused. The player must manually gather to survive.

Transition: Once the condition `!(timber < 5 || rations < 5)` is met (meaning `timber >= 5` and `rations >= 5`), clicking [Establish Camp] reveals the central map area (locked to coordinate 5,5) and transitions to Stage 2.

Stage 2: The First Companions

Visuals: Settlement Map (5x5 grid) is revealed. Allows interacting with plot grids if `stage >= 2 && cell === null && !activeJob`.

Logic: The background simulation tick remains Paused (`if (stage < 3 || showHeroSelection) return;`). Rations begin to drain based on population. The player can construct basic survival structures (Tents, Wagons).

Transition: Once a `houses` structure is constructed (`job.structureName === "houses"`), transition to Stage 3.

Stage 3: Automation & Expansion

Visuals: Worker assignment UI is revealed.

Logic: The 1-second simulation tick begins (`gameTime` interval). Players can assign Pops to roles (Woodcutter, Trapper) to automate resource generation. The Hero Selection overlay is active during transition.

Transition: Once the housing capacity population reaches a threshold (`pop >= 5`), the [Sign the Charter] button appears. Clicking it transitions to Stage 4.

Stage 4: The Dark Kingdom

Visuals: Full UI is unlocked. The 10x10 World Map is revealed. The Kingdom Ledger is fully visible, and the Tech Tree unlocks.

Logic: Simulation tick Resumes. The economy shifts. Build Points (BP), Unrest, and Kingdom XP mechanics are fully active.
