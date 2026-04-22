Project Blueprint: "Pathfinder's Frontier" (Text-Based City Builder)

1. Project Overview

A terminal-based, Object-Oriented simulation game that merges the macro-level kingdom management of Pathfinder: Kingmaker with the micro-level agent simulation of Dwarf Fortress. The game uses a "Dark Room" (Fog of War) exploration mechanic where the player must spend resources to map and claim a procedurally generated world.

The UI is built using React to create a static, dashboard-style interface rather than a scrolling terminal.

2. File Architecture

To keep the codebase clean and scalable, the game relies on structured frontend components.

A. library.js / library.py (The Database)

This file holds all static data, dictionaries, and lists. Keeping this as a library file allows for easy importing and the inclusion of simple helper functions.

FLAVORS: A nested dictionary containing UI colors, ASCII art sets, and text suffixes for different biomes (Swamp, Icy, Necromancy, Desert).

STRUCTURES_DB: A dictionary tracking Build Point (BP) costs, lot sizes, and trait benefits (e.g., "Residential", "Edifice") for buildings like Academies and Taverns.

PROMINENT_CITIZENS: A list of NPC quest-givers and their specific spawn triggers (e.g., Arven the Fisher appearing after a Pier is built).

NAMES: Lists for settlements, heroes, and generic villager pops.

B. App.jsx (The React Frontend App)

This is the main executable interface. It handles the game loop, state management, and the React UI rendering.

class Pop: Tracks individual citizens (name, hunger, happiness, alignment).

class Hex: Tracks the state of a single map coordinate (Hidden, Reconnoitered, Claimed) and its terrain.

class Kingdom: The central brain. Tracks BP, Food, Unrest, and holds the 2D array representing the world map.

3. Core Mechanics

The "Awakening" Early Game Loop (A Dark Room Style)

To faithfully emulate *A Dark Room*, the game begins in a restricted, mysterious state before expanding into the hex-crawling kingdom sim:

- **State 0 (The Wilderness):** The UI is completely blank except for a single option: `[Stoke Campfire]`. The text log reads: *"The Stolen Lands are dark and freezing."* Stoking the fire provides temporary warmth.
- **State 1 (Survival Mode):** The player is forced to manually `[Gather Timber]` and `[Hunt for Rations]` on timers to survive the early nights.
- **State 2 (The First Companions):** A stranger arrives (e.g., *"A weary Brevic Outcast stumbles into the light."*). They become your first resident, unlocking the ability to construct primary survival structures (`Pioneer Tent`, `Supply Wagon`).
- **State 3 (Automation):** As more tents are built, more outcasts, Rostlanders, or Local Brigands arrive at your camp. You can assign these 'Pops' to automate gathering (e.g., as Woodcutters or Trappers).
- **State 4 (Unfurling the Charter):** Once enough basic infrastructure is built and a compass/scouting map is crafted, the player can `[Unfurl the Royal Charter]`. This triggers the "Kingdom mode", revealing the Hex Map, Ledger, and transforming raw resources into BP (Build Points).

The "Dark Room" Exploration Engine

The world is a 2D grid (e.g., 10x10) of Hex objects.

Status 0 (Hidden): Displayed as ??. The player knows nothing about it. Click to call `handleReconnoiter`.

Status 1 (Reconnoitered): Costs BP to scout. Reveals the terrain type and applies Flavor-specific art. Click to call `handleClaim`.

Status 2 (Claimed): Costs BP to annex. Displayed as [C]. Only claimed hexes can have structures built on them. Click to inspect the settlement.

Flavor Sets

The game dynamically re-skins itself based on the chosen "Flavor".

Logic Note: Instead of writing separate if statements for every biome, the render_map() function uses the selected flavor as a key to pull data from the FLAVORS dictionary (e.g., FLAVORS[self.flavor]["farm_art"]).

Default Flavor: Swamp/Florida aesthetic (Lots of Green/Blue UI, Mangroves, high Culture boosts).

The Treasurer's Warning (Financial Guardrail)

Design Concept: To simulate the pressures of kingdom budgeting, the game features a strict financial check.

Logic Note: Before executing any command that costs BP (Build Points)—like mapping a hex or building a structure—the Kingdom class checks if self.bp >= cost. If not, a warning is printed: [-] Treasurer: 'We literally cannot afford to do that right now. Mind the budget!' This prevents the kingdom from going bankrupt (or missing its carriage payments!).

4. UI Layout (React Components)

The terminal is divided into a fixed Layout:

Header: Displays Kingdom Name, Current Turn, and Active Flavor.

Map Panel (Left): Renders the 2D grid using `WorldGrid.jsx` or `SettlementGrid.jsx`.

Ledger Panel (Right): Displays Pathfinder stats (BP, Rations, Unrest, Kingdom XP) and a table of active citizen Pops.

Log Panel (Center-Bottom): A scrolling list of recent events (e.g., "Urist has starved," "Stas the Lumberjack has arrived").

Command Prompt (Footer): Action buttons rendered conditionally based on state (e.g., Gather Timber).

5. Development Roadmap (Phases)

[x] Phase 1: Basic Loop & UI - Establish the rich layout, basic BP/Food variables, and the tick() function.

[x] Phase 2: Database Integration - Separate data into data_libraries.py.

[x] Phase 3: The Dark Map - Implement the 10x10 grid, the Hex class state machine (Hidden -> Reconnoitered -> Claimed), and coordinate commands.

[ ] Phase 4: The Awakening Prologue (A Dark Room Early Game) - Implement the isolated start state where the UI is hidden except for the fire and basic gathering. Add unlocking triggers (manual gathering -> companion arrival -> worker assignment -> revealing the Royal Charter and Hex Map).

[ ] Phase 5: Flavor Sets - Hook the FLAVORS dictionary into the Map Panel to swap ASCII art and rich text styles dynamically.

[ ] Phase 6: Structures & Grids - Allow the build command to place items from STRUCTURES_DB into claimed hexes, deducting BP safely via the Treasurer check.

[ ] Phase 7: Prominent Citizens - Build the "Trigger Observer". A function that runs every turn to check if conditions are met to spawn a quest-giving NPC from the database.
