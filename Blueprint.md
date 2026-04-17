Project Blueprint: "Pathfinder's Frontier" (Text-Based City Builder)

1. Project Overview

A terminal-based, Object-Oriented simulation game that merges the macro-level kingdom management of Pathfinder: Kingmaker with the micro-level agent simulation of Dwarf Fortress. The game uses a "Dark Room" (Fog of War) exploration mechanic where the player must spend resources to map and claim a procedurally generated world.

The UI is built using the Python rich library to create a static, dashboard-style interface rather than a scrolling terminal.

2. File Architecture

To keep the codebase clean and scalable, the game is split into two primary Python files.

A. data_libraries.py (The Database)

This file holds all static data, dictionaries, and lists. Keeping this as a .py file allows for easy importing and the inclusion of simple helper functions.

FLAVORS: A nested dictionary containing UI colors, ASCII art sets, and text suffixes for different biomes (Swamp, Icy, Necromancy, Desert).

STRUCTURES_DB: A dictionary tracking Build Point (BP) costs, lot sizes, and trait benefits (e.g., "Residential", "Edifice") for buildings like Academies and Taverns.

PROMINENT_CITIZENS: A list of NPC quest-givers and their specific spawn triggers (e.g., Arven the Fisher appearing after a Pier is built).

NAMES: Lists for settlements, heroes, and generic villager pops.

B. kingdom_sim.py (The Game Engine)

This is the main executable script. It handles the game loop, state management, and the rich UI rendering.

class Pop: Tracks individual citizens (name, hunger, happiness, alignment).

class Hex: Tracks the state of a single map coordinate (Hidden, Reconnoitered, Claimed) and its terrain.

class Kingdom: The central brain. Tracks BP, Food, Unrest, and holds the 2D array representing the world map.

3. Core Mechanics

The "Dark Room" Exploration Engine

The world is a 2D grid (e.g., 10x10) of Hex objects.

Status 0 (Hidden): Displayed as ??. The player knows nothing about it.

Status 1 (Reconnoitered): Costs BP to scout. Reveals the terrain type and applies Flavor-specific ASCII art (e.g., Swamp trees vs. Icy peaks).

Status 2 (Claimed): Costs BP to annex. Displayed as [C]. Only claimed hexes can have structures built on them.

Flavor Sets

The game dynamically re-skins itself based on the chosen "Flavor".

Logic Note: Instead of writing separate if statements for every biome, the render_map() function uses the selected flavor as a key to pull data from the FLAVORS dictionary (e.g., FLAVORS[self.flavor]["farm_art"]).

Default Flavor: Swamp/Florida aesthetic (Lots of Green/Blue UI, Mangroves, high Culture boosts).

The Treasurer's Warning (Financial Guardrail)

Design Concept: To simulate the pressures of kingdom budgeting, the game features a strict financial check.

Logic Note: Before executing any command that costs BP (Build Points)—like mapping a hex or building a structure—the Kingdom class checks if self.bp >= cost. If not, a warning is printed: [-] Treasurer: 'We literally cannot afford to do that right now. Mind the budget!' This prevents the kingdom from going bankrupt (or missing its carriage payments!).

4. UI Layout (rich Library)

The terminal is divided into a fixed Layout:

Header: Displays Kingdom Name, Current Turn, and Active Flavor.

Map Panel (Left): Renders the 2D "Dark Room" ASCII grid.

Ledger Panel (Right): Displays Pathfinder stats (BP, Food, Unrest, Kingdom XP) and a table of active citizen Pops.

Log Panel (Center-Bottom): A scrolling list of the last 5-7 events (e.g., "Urist has starved," "Stas the Lumberjack has arrived").

Command Prompt (Footer): Where the user types commands (r 5,5 to reconnoiter, build farm, etc.).

5. Development Roadmap (Phases)

[x] Phase 1: Basic Loop & UI - Establish the rich layout, basic BP/Food variables, and the tick() function.

[x] Phase 2: Database Integration - Separate data into data_libraries.py.

[ ] Phase 3: The Dark Map - Implement the 10x10 grid, the Hex class state machine (Hidden -> Reconnoitered -> Claimed), and coordinate commands.

[ ] Phase 4: Flavor Sets - Hook the FLAVORS dictionary into the Map Panel to swap ASCII art and rich text styles dynamically.

[ ] Phase 5: Structures & Grids - Allow the build command to place items from STRUCTURES_DB into claimed hexes, deducting BP safely via the Treasurer check.

[ ] Phase 6: Prominent Citizens - Build the "Trigger Observer". A function that runs every turn to check if conditions are met to spawn a quest-giving NPC from the database.
