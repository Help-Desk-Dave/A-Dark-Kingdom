import os
import random
import threading
import time
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from library import (
    FLAVORS, STRUCTURES_DB, PROMINENT_CITIZENS, get_random_citizen,
    RECON_COST, CLAIM_COST, ANNUAL_UPKEEP, HOUSING_CAPACITY,
    KINGMAKER_BACKGROUNDS
)

console = Console()

# --- LOGIC LAYER: SETTLEMENTS ---
# Represents a physical settlement on the world map, featuring a 5x5 buildable grid.
class Settlement:
    # Initializes a new settlement with an empty 5x5 grid and tracks lot usage.
    def __init__(self, name="Unnamed Settlement"):
        self.name = name
        # 5x5 Grid for structures. None means empty.
        # 5x5 Grid for structures. None means empty.
        # Used to spatially track building placement, critical for multi-lot structures.
        self.grid = [[None for _ in range(5)] for _ in range(5)]
        # Tracks how many lots are occupied by residential structures (e.g., houses, barracks).
        self.residential_lots = 0
        # Tracks how many lots are occupied by non-residential structures.
        self.other_lots = 0

    # Computed property to check if the settlement is overcrowded based on residential vs non-residential lots.
    @property
    def is_overcrowded(self):
        # Overcrowded if residential lots are less than 1 for every HOUSING_CAPACITY other lots
        # Overcrowded if residential lots are less than 1 for every HOUSING_CAPACITY other lots.
        return self.residential_lots < (self.other_lots // HOUSING_CAPACITY)

    # Attempts to construct a building at the specified (x,y) coordinates within the settlement's 5x5 grid.
    def build(self, structure_name, x, y, logs):
        # Normalize the name to ensure it matches the keys in STRUCTURES_DB.
        structure_name = structure_name.lower()
        # Guard clause: Abort if the structure does not exist in the database.
        if structure_name not in STRUCTURES_DB:
            logs.append(f"[-] Unknown structure: '{structure_name}'.")
            return False

        # Retrieve structure details (lots required, cost, traits, etc.)
        structure = STRUCTURES_DB[structure_name]
        # The footprint size of the building (e.g., 1, 2, or 4 lots).
        lots_needed = structure["lots"]
        # Check if the building provides housing to mitigate overcrowding.
        is_residential = "residential" in structure["traits"]

        # ---------------------------------------------------------
        # ---------------------------------------------------------
        # We need to verify that the required space starting at (x, y)
        # is completely within the 5x5 grid boundaries and that every
        # lot in the required footprint is currently empty (None).
        #
        # For 1-lot buildings: We just check the single cell at (x, y).
        # For 2-lot buildings: We check two adjacent cells.
        #   First, we check horizontally (x, y) and (x+1, y).
        #   If that fails or goes out of bounds, we check vertically
        #   (x, y) and (x, y+1).
        # For 4-lot buildings: We check a 2x2 square starting at (x, y).
        #   The coordinates are (x,y), (x+1,y), (x,y+1), (x+1,y+1).
        # ---------------------------------------------------------

        positions_to_fill = []

        if lots_needed == 1:
            if x < 0 or x >= 5 or y < 0 or y >= 5 or self.grid[y][x] is not None:
                logs.append(f"[-] Cannot build {structure_name} at {x},{y}: Space is blocked or out of bounds.")
                return False
            positions_to_fill.append((x, y))

        elif lots_needed == 2:
            # Check horizontal (1x2)
            horizontal_clear = True
            if x < 0 or x + 1 >= 5 or y < 0 or y >= 5:
                horizontal_clear = False
            else:
                if self.grid[y][x] is not None or self.grid[y][x+1] is not None:
                    horizontal_clear = False

            if horizontal_clear:
                positions_to_fill = [(x, y), (x+1, y)]
            else:
                # Check vertical (2x1)
                vertical_clear = True
                if x < 0 or x >= 5 or y < 0 or y + 1 >= 5:
                    vertical_clear = False
                else:
                    if self.grid[y][x] is not None or self.grid[y+1][x] is not None:
                        vertical_clear = False

                if vertical_clear:
                    positions_to_fill = [(x, y), (x, y+1)]
                else:
                    logs.append(f"[-] Cannot build {structure_name} at {x},{y}: Need 2 contiguous lots.")
                    return False

        elif lots_needed == 4:
            # Check 2x2 square
            if x < 0 or x + 1 >= 5 or y < 0 or y + 1 >= 5:
                logs.append(f"[-] Cannot build {structure_name} at {x},{y}: 2x2 area goes out of bounds.")
                return False
            if (self.grid[y][x] is not None or self.grid[y][x+1] is not None or
                self.grid[y+1][x] is not None or self.grid[y+1][x+1] is not None):
                logs.append(f"[-] Cannot build {structure_name} at {x},{y}: 2x2 area is not clear.")
                return False
            positions_to_fill = [(x, y), (x+1, y), (x, y+1), (x+1, y+1)]
        else:
            logs.append(f"[-] Structures with {lots_needed} lots are not supported.")
            return False

        # Apply building to grid
        for px, py in positions_to_fill:
            self.grid[py][px] = structure_name

        # Update lot statistics
        if is_residential:
            self.residential_lots += lots_needed
        else:
            self.other_lots += lots_needed

        logs.append(f"[+] Built {structure_name.capitalize()} at {x},{y}. Lots used: {lots_needed}.")
        return True

    def render_grid(self):
        map_display = Text()
        for y in range(5):
            for x in range(5):
                structure = self.grid[y][x]
                if structure is None:
                    map_display.append(" [ ] ", style="dim")
                else:
                    # structure is expected to be the string name, like "Academy", we take first letter
                    initial = structure[0].upper()
                    map_display.append(f" [{initial}] ", style="bold white on blue")
            map_display.append("\n")
        return map_display

# --- LOGIC LAYER: POPULATION ---
# Represents an individual citizen (Agent) within the kingdom with RPG-style stats.
class Pop:
    def __init__(self, name):
        self.name = name
        self.hunger = 0
        self.happiness = 100
        self.is_alive = True

        # Determine alignment based on pathfinder
        alignments = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"]
        self.alignment = random.choice(alignments)

        # Stats ranging from 8 to 18
        self.strength = random.randint(8, 18)
        self.intelligence = random.randint(8, 18)
        self.charisma = random.randint(8, 18)

# --- LOGIC LAYER: WORLD MAP ---
# Represents a single hexagonal tile on the 10x10 world map.
class Hex:
    def __init__(self, terrain):
        self.terrain = terrain
        self.feature = None
        self.settlement = None
        # Status: 0 = Hidden (??), 1 = Reconnoitered (Terrain Visible), 2 = Claimed ([C])
        self.status = 0 
        self.building = None

# --- LOGIC LAYER: CORE ENGINE ---
# The main game engine handling the kingdom's state, resources, UI rendering, and simulation loop.
class Kingdom:
    def __init__(self, name, flavor="swamp"):
        self.lock = threading.Lock()
        self.name = name
        self.flavor = flavor
        self.bp = 60 # Starting Build Points
        self.food = 40
        self.unrest = 0
        self.xp = 0
        self.stone = 0
        self.level = 1
        self.turn = 1
        self.spawned_citizens = set()
        
        # Flavor Set Config
        self.style = FLAVORS[flavor]
        
        # World Generation (10x10)
        self.world = []
        self.generate_world()
        
        # View state: "world" or a tuple like (5, 5) for a specific hex's settlement
        self.current_view = "world"

        # Stage Progression
        # Stage Progression
        # 0: The Wilderness
        # 1: Survival Mode
        # 2: The First Companions
        # 3: Automation
        # 4: The Charter
        self.stage = 0

        # Intercept state for hero selection
        self.pending_hero_selection = True

        # Early game survival resources
        self.sticks = 0
        self.timber = 0
        self.rations = 0

        # Worker assignment
        self.woodcutters = 0
        self.trappers = 0

        self.scouting_map_crafted = False

        # Starting position (Heartland)
        self.start_x, self.start_y = 5, 5
        self.log = ["The Stolen Lands are dark and freezing."]

        self.loyalty = 0
        self.citizens = []
        self.advisors = {"general": None, "treasurer": None, "diplomat": None, "ruler": None}

        self.world[self.start_y][self.start_x].status = 2 # Capital is claimed
        self.world[self.start_y][self.start_x].settlement = Settlement("Capital")
        self.tick_count = 0
        self.ruler_is_busy = False

    # The main real-time simulation tick. Advances the game clock, calculates resources, and triggers events.
    def tick(self):
        with self.lock:
            if self.stage < 1 or self.pending_hero_selection:
                return

            self.tick_count += 1
            self.ruler_is_busy = False  # Ruler is free at the start of a new tick

            # Stage 1: Survival Mode
            if self.stage == 1:
                # 20% chance to find an Outcast
                if random.random() < 0.20:
                    self.stage = 2
                    self.citizens.append(Pop("Brevic Outcast"))
                    self.log.append("[+] A weary Brevic Outcast stumbles into the light. You are no longer alone.")
                return

            # Stage 2+: The First Companions / Automation
            if self.stage >= 2 and self.stage < 4:
                # Produce resources
                self.timber += self.woodcutters * 1
                self.rations += self.trappers * 1

                # Consume rations every 2 ticks
                if self.tick_count % 2 == 0:
                    consumption = len(self.citizens)
                    if self.rations >= consumption:
                        self.rations -= consumption
                    else:
                        self.rations = 0
                        self.unrest += 1
                        self.log.append("[-] Starvation! Citizens are starving, Unrest increases.")

                # Population growth
                max_capacity = 2 + (self.count_structures("pioneer tent") * 4)
                if len(self.citizens) < max_capacity:
                    # 15% chance to grow
                    if random.random() < 0.15:
                        self.citizens.append(Pop(get_random_citizen()))
                        self.log.append("[+] A new wanderer arrives at the camp.")

            if self.stage < 4:
                return

            # Passive Shield Mechanic
            if self.loyalty > 10 and self.unrest > 0:
                if random.random() < 0.5: # 50% chance
                    self.unrest = max(0, self.unrest - 1)
                    self.log.append("[+] High Loyalty automatically reduced Unrest by 1.")

            # Advisor Modifiers
            if self.advisors.get("treasurer") and self.advisors["treasurer"].is_alive:
                bonus = self.advisors["treasurer"].intelligence // 4
                self.bp += bonus
                self.log.append(f"[+] Treasurer {self.advisors['treasurer'].name} collected {bonus} extra BP.")

            if self.advisors.get("general") and self.advisors["general"].is_alive:
                reduction = self.advisors["general"].strength // 4
                if self.unrest > 0:
                    self.unrest = max(0, self.unrest - reduction)
                    self.log.append(f"[+] General {self.advisors['general'].name} reduced Unrest by {reduction}.")

            if self.advisors.get("diplomat") and self.advisors["diplomat"].is_alive:
                boost = self.advisors["diplomat"].charisma // 4
                self.loyalty += boost
                self.log.append(f"[+] Diplomat {self.advisors['diplomat'].name} improved Loyalty by {boost}.")
            # Advisor Modifiers (Attribute // 4)
            treasurer_bonus = self.advisors.get("Treasurer", {}).get("attribute", 0) // 4
            self.bp += treasurer_bonus

            if self.tick_count % 12 == 0:
                self.bp -= ANNUAL_UPKEEP
                self.log.append(f"[-] Annual Upkeep: Paid {ANNUAL_UPKEEP} BP.")
                if self.bp < 0:
                    self.unrest += 1
                    self.log.append("[!] Debt causes unrest!")

    def establish_camp(self):
        if self.stage == 1:
            self.stage = 2
            self.world[self.start_y][self.start_x].status = 2 # Capital is claimed
            self.world[self.start_y][self.start_x].settlement = Settlement("Camp")
            self.log.append("[+] Camp established at (5,5).")
        else:
            self.log.append("[!] Camp already established.")

    def generate_world(self):
        """Note: Uses a simple nested loop to fill the map with random terrain types."""
        terrain_types = ["Forest", "Plain", "Mountain", "Hill", "Swamp"]
        pois = ["Ruins", "Resource Node"]
        for y in range(10):
            row = [Hex(random.choice(terrain_types)) for x in range(10)]
            self.world.append(row)

        # Randomly assign 5 POIs
        pois_assigned = 0
        while pois_assigned < 5:
            px = random.randint(0, 9)
            py = random.randint(0, 9)
            if (px != 5 or py != 5) and self.world[py][px].feature is None:
                self.world[py][px].feature = random.choice(pois)
                pois_assigned += 1

    def check_prominent_citizens(self):
        # Pre-compute all structure counts in one pass to avoid O(N*M) nested loops per trigger
        structure_counts = self.get_structure_counts()

        def get_structure_count(structure_name):
            target = structure_name.lower()
            count = structure_counts.get(target, 0)
            lots = STRUCTURES_DB.get(target, {}).get("lots", 1)
            return count // lots

        for citizen in PROMINENT_CITIZENS:
            name = citizen["name"]
            if name in self.spawned_citizens:
                continue

            trigger = citizen["trigger"]
            conditions_met = False

            if trigger == "Kingdom founded":
                conditions_met = True
            elif trigger == "Build a Pier":
                conditions_met = get_structure_count("pier") >= 1
            elif trigger == "Build a Lumberyard":
                conditions_met = get_structure_count("lumberyard") >= 1
            elif trigger == "Build a Manor/Craft Luxuries":
                conditions_met = get_structure_count("manor") >= 1
            elif trigger == "Build an Academy or Museum":
                conditions_met = get_structure_count("academy") >= 1 or get_structure_count("museum") >= 1
            elif trigger == "Build a Noble Villa":
                conditions_met = get_structure_count("noble villa") >= 1
            elif trigger == "Build 3 Breweries":
                conditions_met = get_structure_count("brewery") >= 3
            elif trigger == "Kingdom Level 17":
                conditions_met = self.level >= 17
            elif trigger == "Claim a swamp hex":
                swamp_claimed = False
                for row in self.world:
                    for hex_obj in row:
                        if hex_obj.status == 2 and hex_obj.terrain.lower() == "swamp":
                            swamp_claimed = True
                            break
                    if swamp_claimed:
                        break
                conditions_met = swamp_claimed
            elif trigger == "Random Event":
                conditions_met = random.random() < 0.05 # 5% chance per turn

            if conditions_met:
                self.spawned_citizens.add(name)
                title = citizen["title"]
                quest = citizen["quest"]
                self.log.append(f"[*] PROMINENT CITIZEN ARRIVES: {name}, {title}. Quest: {quest}")

    # Manually forces a simulation tick (1 Month) for testing or CLI interaction without waiting 5 seconds.
    def monthly_tick(self):
        self.turn += 1
        self.log.append(f"--- Month {self.turn} Begins ---")
        self.check_prominent_citizens()

    def count_structures(self, structure_name):
        # Normalize the name to ensure it matches the keys in STRUCTURES_DB.
        structure_name = structure_name.lower()
        # Guard clause: Abort if the structure does not exist in the database.
        if structure_name not in STRUCTURES_DB:
            return 0

        lots_per_building = STRUCTURES_DB[structure_name]["lots"]
        total_lots_found = 0

        for row in self.world:
            for hex_obj in row:
                if hex_obj.settlement:
                    for sy in range(5):
                        for sx in range(5):
                            if hex_obj.settlement.grid[sy][sx] == structure_name:
                                total_lots_found += 1

        return total_lots_found // lots_per_building

    # Action: Spend BP to map an unexplored hex (status 0 -> 1), making it eligible to be claimed.
    def get_structure_counts(self):
        """Returns a dictionary of structure counts to optimize check_prominent_citizens."""
        counts = {}
        for row in self.world:
            for hex_obj in row:
                if hex_obj.settlement:
                    for sy in range(5):
                        for sx in range(5):
                            cell = hex_obj.settlement.grid[sy][sx]
                            if cell is not None:
                                name = cell.lower()
                                counts[name] = counts.get(name, 0) + 1
        return counts

    def reconnoiter(self, x, y):
        """Note: Pathfinder Rule - Surveying a hex reveals its contents but costs resources."""
        if self.stage < 2: return
        # Treasurer's Warning: Using a check to prevent overspending
        cost = 5
        cost = RECON_COST

        # Guardrail check
        if self.bp - cost < 0:
            self.log.append("[-] Treasurer: 'We literally cannot afford to map that area right now.'")
            return
        elif self.bp - cost < 15:
             self.log.append("[-] Treasurer WARNING: Funds are critically low! Reconsidering recon.")
             return

        if 0 <= x < 10 and 0 <= y < 10:
            if self.world[y][x].status == 0:
                self.bp -= cost
                self.world[y][x].status = 1
                self.log.append(f"[+] Reconnoitered ({x},{y}). It is a {self.world[y][x].terrain}.")
                if self.world[y][x].feature:
                    self.log.append(f"[*] Discovery: Found {self.world[y][x].feature} at ({x},{y})!")
            else:
                self.log.append("[!] That area is already mapped.")
        else:
            self.log.append(f"[!] ({x},{y}) is out of bounds!")

    # Action: Routes a build command to the settlement currently active in the view.
    def build_structure(self, structure_name, x, y):
        if self.stage < 2: return
        # We need to be viewing a settlement to build
        if self.current_view == "world":
            self.log.append("[!] You must be viewing a settlement to build. Use [V]iew x,y.")
            return

        sx, sy = self.current_view
        hex_obj = self.world[sy][sx]
        if hex_obj.settlement is None:
            if hex_obj.status == 2: # Claimed
                # Auto-initialize a settlement if claimed but empty
                hex_obj.settlement = Settlement(f"Settlement ({sx},{sy})")
                self.log.append(f"[+] Initialized new settlement at {sx},{sy}.")
            else:
                self.log.append("[!] You must claim this hex before building a settlement here.")
                return

        # Normalize the name to ensure it matches the keys in STRUCTURES_DB.
        structure_name = structure_name.lower()
        # Guard clause: Abort if the structure does not exist in the database.
        if structure_name not in STRUCTURES_DB:
            self.log.append(f"[-] Unknown structure: '{structure_name}'.")
            return

        # Retrieve structure details (lots required, cost, traits, etc.)
        structure = STRUCTURES_DB[structure_name]

        # Determine cost based on structure and stage
        cost_timber = structure.get("cost_timber", 0)
        cost_rations = structure.get("cost_rations", 0)
        cost_stone = structure.get("cost_stone", 0)

        if getattr(self, "stone", None) is None:
            self.stone = 0

        if self.timber < cost_timber or self.rations < cost_rations or self.stone < cost_stone:
            self.log.append(f"[-] Missing materials for {structure_name.capitalize()}! Need {cost_timber} Timber, {cost_rations} Rations, {cost_stone} Stone.")
            return

        # Attempt to build
        success = hex_obj.settlement.build(structure_name, x, y, self.log)
        if success:
            if cost_timber > 0:
                self.timber -= cost_timber
            if cost_rations > 0:
                self.rations -= cost_rations
            if cost_stone > 0:
                self.stone -= cost_stone

            if self.stage == 2 and structure_name == "houses":
                self.stage = 3
                self.log.append("[!] Citizens arrive and build houses. The Kingdom expands!")
            elif self.stage == 2 and self.count_structures("pioneer tent") >= 3 and self.count_structures("supply wagon") >= 1:
                self.stage = 3
                self.log.append("[+] Camp infrastructure is stable. We can now consider automation and exploration.")

    # Action: Spend BP to annex a mapped hex (status 1 -> 2), expanding the kingdom's borders.
    def claim_hex(self, x, y):
        """Note: You must Reconnoiter a hex (status 1) before you can Claim it (status 2)."""
        if self.stage < 2: return
        cost = CLAIM_COST

        if 0 <= x < 10 and 0 <= y < 10:
            if self.world[y][x].status == 1:
                # Guardrail check
                if self.bp - cost < 0:
                    self.log.append("[-] Treasurer: 'Claiming land requires BP we don't have.'")
                    return
                elif self.bp - cost < 15:
                     self.log.append("[-] Treasurer WARNING: Funds are critically low! Reconsidering claim.")
                     return

                self.bp -= cost
                self.world[y][x].status = 2
                self.xp += 10 # Milestone: 10 XP per hex
                self.log.append(f"[+] Claimed ({x},{y}). Kingdom Size +1.")
            else:
                self.log.append("[!] You must map this area before claiming it!")
        else:
            self.log.append(f"[!] ({x},{y}) is out of bounds!")


    def render_map(self):
        """Note: This logic checks the 'status' of every hex to decide what to show Jules."""
        map_display = Text()
        for y in range(10):
            for x in range(10):
                hex_obj = self.world[y][x]
                if hex_obj.status == 0:
                    map_display.append(" ?? ", style="dim")
                elif hex_obj.status == 1:
                    # Show terrain based on Flavor
                    char = self.style.get(hex_obj.terrain, " . ")
                    map_display.append(char, style=self.style["color"])
                elif hex_obj.status == 2:
                    char = self.style.get(hex_obj.terrain, " . ")
                    map_display.append(f"[{char.strip()}]", style="bold gold1")
            map_display.append("\n")
        return map_display

# --- UI LAYER: RICH DASHBOARD ---
# Renders the terminal interface using the 'rich' library.
def draw_ui(game):
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="main", ratio=1),
        Layout(name="footer", size=3)
    )
    # Redefine layout
    layout["main"].split_column(
        Layout(name="map_and_stats", ratio=3),
        Layout(name="log", ratio=1)
    )
    layout["main"]["map_and_stats"].split_row(
        Layout(name="map", ratio=2),
        Layout(name="stats", ratio=1)
    )

    # Apply Flavor Visuals
    header_color = game.style["color"]
    layout["header"].update(Panel(f"👑 {game.name.upper()} | Flavor: {game.flavor.capitalize()}", style=f"bold {header_color}"))
    
    if game.pending_hero_selection:
        # Render Hero Selection Screen
        options_text = Text("Choose a Background for your Ruler:\n\n", style="bold yellow")
        for i, bg in enumerate(KINGMAKER_BACKGROUNDS):
            options_text.append(f"[{i+1}] {bg['name']}\n", style="bold white")
            options_text.append(f"    Skill: {bg['skill']} | Bonus: +1 {bg['attribute']}\n", style="cyan")
            options_text.append(f"    {bg['desc']}\n\n", style="dim")

        layout["main"]["map_and_stats"]["map"].update(Panel(options_text, title="Hero Selection", border_style="yellow"))
    elif game.stage < 2:
        layout["main"]["map_and_stats"]["map"].update(Panel(Text("You are in the dark wilderness.", justify="center", style="dim"), title="The Wilderness", border_style=header_color))
    elif game.current_view == "world" and game.stage >= 4:
        layout["main"]["map_and_stats"]["map"].update(Panel(game.render_map(), title="World Map (Stolen Lands)", border_style=header_color))
    elif game.current_view == "world" and game.stage < 4:
        layout["main"]["map_and_stats"]["map"].update(Panel(Text("World Map is restricted until the Charter is signed.", style="dim"), title="World Map (Restricted)", border_style=header_color))
    else:
        sx, sy = game.current_view
        hex_obj = game.world[sy][sx]
        if hex_obj.settlement:
            map_content = hex_obj.settlement.render_grid()
            title = f"Settlement: {hex_obj.settlement.name} at ({sx},{sy})"
            if hex_obj.settlement.is_overcrowded:
                title += " [bold red](OVERCROWDED)[/]"
        else:
            map_content = Text("No settlement here.", style="dim")
            title = f"Hex ({sx},{sy})"
        layout["main"]["map_and_stats"]["map"].update(Panel(map_content, title=title, border_style="blue"))
    
    # Stats Table
    stats = Table.grid(expand=True)

    if game.stage >= 4:
        # Ruler Info
        if game.advisors.get("ruler"):
            ruler = game.advisors["ruler"]
            stats.add_row("Ruler:", ruler["name"])
            stats.add_row("Skill:", ruler["skill"])
            stats.add_row("Bonus:", f"+1 {ruler['attribute']}")
            stats.add_row("---", "---")

        stats.add_row("BP (Treasury):", str(game.bp))
        stats.add_row("Unrest:", str(game.unrest))
        stats.add_row("Kingdom XP:", str(game.xp))
        stats.add_row("Timber:", str(game.timber))
        stats.add_row("Rations:", str(game.rations))
        stats.add_row("Pops:", str(len(game.citizens)))

        stats.add_row("---", "---")
        stats.add_row("[bold yellow]Charter: Advisors[/]", "")
        for role, advisor in game.advisors.items():
            if role != "ruler" and advisor:
                # Handle dictionary (from old config) or Pop object
                name = advisor.get('name') if isinstance(advisor, dict) else advisor.name
                attr = advisor.get('attribute') if isinstance(advisor, dict) else getattr(advisor, role + '_attr', 'N/A')
                stats.add_row(f"{role.capitalize()}:", f"{name} (Attr: {attr})")

        if game.current_view != "world":
            sx, sy = game.current_view
            if game.world[sy][sx].settlement:
                settlement = game.world[sy][sx].settlement
                stats.add_row("---", "---")
                stats.add_row("Res. Lots:", str(settlement.residential_lots))
                stats.add_row("Other Lots:", str(settlement.other_lots))
        layout["main"]["map_and_stats"]["stats"].update(Panel(stats, title="Kingdom Ledger"))
    else:
        stats.add_row("Sticks:", str(game.sticks) if game.stage == 0 else "---")
        if game.stage >= 1:
            stats.add_row("Timber:", str(game.timber))
            stats.add_row("Rations:", str(game.rations))
            stats.add_row("Pops:", str(len(game.citizens)))
        if game.stage >= 2:
            stats.add_row("Woodcutters:", str(game.woodcutters))
            stats.add_row("Trappers:", str(game.trappers))
        layout["main"]["map_and_stats"]["stats"].update(Panel(stats, title="Survival Ledger"))
    
    # Render log
    log_content = "\n".join(game.log[-5:])
    layout["log"].update(Panel(log_content, title="Event Log", border_style="white"))

    if game.pending_hero_selection:
        layout["footer"].update(Panel("Commands: Enter a number [1-7] to select your background | [Q]uit"))
    elif game.stage == 0:
        layout["footer"].update(Panel("Commands: [G]ather sticks | [B]uild fire | [Q]uit"))
    elif game.stage == 1:
        layout["footer"].update(Panel("Commands: [G]ather timber | [H]unt rations | [S]toke fire | [Q]uit"))
    elif game.stage == 2:
        layout["footer"].update(Panel("Commands: [V]iew x,y | [B]uild <structure> x,y | [A]ssign <role> <amount> | [Q]uit"))
    elif game.stage == 3:
        layout["footer"].update(Panel("Commands: [V]iew x,y | [B]uild <structure> x,y | [A]ssign <role> <amount> | [C]raft map | Sign Charter | [Q]uit"))
    else:
        layout["footer"].update(Panel("Commands: [V]iew x,y / world | [R]econnoiter x,y | [C]laim x,y | [B]uild <structure> x,y | [E]xport <timber/rations> | Flavor <name> | [N]ext | [Q]uit"))
    
    console.print(layout)

# --- THREADING: BACKGROUND LOOP ---
# Runs the game.tick() in the background every 5 seconds to simulate real-time progression.
def simulation_loop(game):
    while True:
        time.sleep(5)
        game.tick()
        # In a real CLI, we might need a better way to refresh the UI asynchronously.
        # For now, it refreshes on input.

# --- Logic Phase ---
# Since you're a Floridian, I've defaulted it to Swamp flavor!
# ---------------------------------------------------------
# MAIN EXECUTION BLOCK (CLI APP)
# Protects the interactive CLI from running when Engine.py is imported for testing.
# ---------------------------------------------------------
if __name__ == "__main__":
    # Instantiate the Kingdom singleton with the default Swamp flavor.
    my_game = Kingdom("The Sunken Glades", flavor="swamp")

    # Start the background real-time simulation thread as a daemon (closes when main thread closes).
    sim_thread = threading.Thread(target=simulation_loop, args=(my_game,), daemon=True)
    sim_thread.start()

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        with my_game.lock:
            draw_ui(my_game)

        # Prompt the user for input, convert to lowercase, and split into arguments.
        action = input("\n> ").lower().split()
        if not action: continue

        # Command [Q]: Quit the game loop and exit the application.
        if action[0] == 'q': break

        # Early Survival Mechanics (Stages 0-1)
        if my_game.stage == 0 and action[0] == 'g' and len(action) > 1 and action[1] == 'sticks':
            if my_game.ruler_is_busy:
                my_game.log.append("[-] The Ruler is currently busy. Wait for the next tick.")
            else:
                my_game.ruler_is_busy = True
                my_game.sticks += 1
                if my_game.sticks >= 10:
                    my_game.log.append("[+] You have enough sticks. You can now build a fire (b fire).")
                else:
                    my_game.log.append(f"[+] Gathered a stick. ({my_game.sticks}/10)")
            continue

        if my_game.stage == 0 and my_game.sticks >= 10 and action[0] == 'b' and len(action) > 1 and action[1] == 'fire':
            with my_game.lock:
                my_game.stage = 1
                my_game.sticks -= 10
                my_game.log.append("[+] The fire crackles to life. The survival begins.")
            continue

        if my_game.stage >= 1:
            if action[0] == 'g' and len(action) > 1 and action[1] == 'timber':
                if my_game.ruler_is_busy:
                    my_game.log.append("[-] The Ruler is currently busy. Wait for the next tick.")
                else:
                    my_game.ruler_is_busy = True
                    my_game.timber += 1
                    my_game.log.append("[+] Gathered 1 Timber.")
                continue
            if action[0] == 'h' and len(action) > 1 and action[1] == 'rations':
                if my_game.ruler_is_busy:
                    my_game.log.append("[-] The Ruler is currently busy. Wait for the next tick.")
                else:
                    my_game.ruler_is_busy = True
                    my_game.rations += 1
                    my_game.log.append("[+] Hunted 1 Ration.")
                continue
            if action[0] == 's' and len(action) > 1 and action[1] == 'fire' and my_game.stage == 1:
                if my_game.ruler_is_busy:
                    my_game.log.append("[-] The Ruler is currently busy. Wait for the next tick.")
                else:
                    my_game.ruler_is_busy = True
                    my_game.log.append("[+] You stoked the campfire.")
                continue

        # Automation Assignment (Stage 2+)
        if my_game.stage >= 2 and action[0] == 'a' and len(action) >= 3:
            role = action[1]
            try:
                amount = int(action[2])
                available_pops = len(my_game.citizens) - my_game.woodcutters - my_game.trappers

                if role == 'woodcutter':
                    if amount > 0 and available_pops >= amount:
                        my_game.woodcutters += amount
                        my_game.log.append(f"[+] Assigned {amount} Woodcutter(s).")
                    elif amount < 0 and my_game.woodcutters >= abs(amount):
                        my_game.woodcutters += amount
                        my_game.log.append(f"[+] Unassigned {abs(amount)} Woodcutter(s).")
                    else:
                        my_game.log.append("[-] Invalid assignment amount.")
                elif role == 'trapper':
                    if amount > 0 and available_pops >= amount:
                        my_game.trappers += amount
                        my_game.log.append(f"[+] Assigned {amount} Trapper(s).")
                    elif amount < 0 and my_game.trappers >= abs(amount):
                        my_game.trappers += amount
                        my_game.log.append(f"[+] Unassigned {abs(amount)} Trapper(s).")
                    else:
                        my_game.log.append("[-] Invalid assignment amount.")
                else:
                    my_game.log.append(f"[-] Unknown role: {role}")
            except ValueError:
                pass
            continue

        # Crafting Scouting Map (Stage 3)
        if my_game.stage == 3 and action[0] == 'c' and len(action) > 1 and action[1] == 'map':
            if my_game.count_structures("pioneer tent") >= 3 and my_game.count_structures("supply wagon") >= 1:
                if my_game.timber >= 100 and my_game.rations >= 50:
                    with my_game.lock:
                        my_game.timber -= 100
                        my_game.rations -= 50
                        my_game.scouting_map_crafted = True
                        my_game.log.append("[+] The surrounding hexes have been charted. It is time to claim this land.")
                else:
                    my_game.log.append("[-] Insufficient resources to craft Scouting Map (requires 100 Timber, 50 Rations).")
            else:
                my_game.log.append("[-] You need 3 Pioneer Tents and 1 Supply Wagon to craft a Scouting Map.")
            continue

        # Export Goods (Stage 4)
        if my_game.stage == 4 and action[0] == 'e' and len(action) > 1:
            resource = action[1]
            if resource == 'timber':
                if my_game.timber >= 100:
                    my_game.timber -= 100
                    my_game.bp += 1
                    my_game.log.append("[+] Exported 100 Timber for 1 BP.")
                else:
                    my_game.log.append("[-] Insufficient Timber to export (requires 100).")
            elif resource == 'rations':
                if my_game.rations >= 100:
                    my_game.rations -= 100
                    my_game.bp += 1
                    my_game.log.append("[+] Exported 100 Rations for 1 BP.")
                else:
                    my_game.log.append("[-] Insufficient Rations to export (requires 100).")
            continue

        # Handle Hero Selection Input
        if my_game.pending_hero_selection:
            try:
                choice = int(action[0])
                if 1 <= choice <= len(KINGMAKER_BACKGROUNDS):
                    bg = KINGMAKER_BACKGROUNDS[choice - 1]
                    with my_game.lock:
                        my_game.advisors["ruler"] = bg
                        my_game.pending_hero_selection = False
                        my_game.stage = 4
                        my_game.log.append(f"[+] The Ruler's history as a {bg['name']} becomes known...")
                        my_game.log.append("[+] The Charter has been signed. The World Map is now open.")
                else:
                    my_game.log.append("[-] Please select a valid number between 1 and 7.")
            except ValueError:
                my_game.log.append("[-] Invalid input. Enter a number to select your background.")
            continue

        if action[0] in ['u', 'sign'] and len(action) > 1 and action[1] == 'charter':
            with my_game.lock:
                if my_game.stage == 3 and my_game.scouting_map_crafted:
                    my_game.pending_hero_selection = True
                    my_game.log.append("[*] Preparing the Charter. Who shall rule these lands?")
                elif my_game.stage >= 4:
                    my_game.log.append("[-] The Charter is already signed.")
                else:
                    my_game.log.append("[-] You are not ready to sign the Charter yet (requires Stage 3 and crafting the Scouting Map).")
            continue

        # Command [N]: Forcibly advance the game clock by 1 month immediately.
        if action[0] in ['n', 'next']:
            my_game.monthly_tick()
        # Command [R] x,y: Reconnoiter (map) a target hex coordinate.
        if action[0] == 'r' and len(action) == 2:
            try:
                coords = action[1].split(',')
                my_game.reconnoiter(int(coords[0]), int(coords[1]))
            except Exception: pass
        # Command [V] x,y or world: Toggle the UI view between the world map or a specific settlement grid.
        if action[0] == 'v' and len(action) == 2:
            if action[1] == 'world':
                if my_game.stage >= 4:
                    my_game.current_view = 'world'
                    my_game.log.append('[+] Viewing World Map.')
                else:
                    my_game.log.append('[-] World map is restricted until the Charter is signed.')
            else:
                try:
                    coords = action[1].split(',')
                    vx, vy = int(coords[0]), int(coords[1])
                    if 0 <= vx < 10 and 0 <= vy < 10:
                        if my_game.world[vy][vx].status > 0:
                            my_game.current_view = (vx, vy)
                            my_game.log.append(f'[+] Viewing Hex ({vx},{vy}).')
                        else:
                            my_game.log.append(f'[-] Hex ({vx},{vy}) is unmapped.')
                    else:
                        my_game.log.append(f'[!] ({vx},{vy}) is out of bounds!')
                except Exception:
                    pass
        # Command [B] <name> x,y: Build a structure on the active settlement grid at coordinate (x,y).
        if action[0] == 'b' and len(action) >= 3:
            try:
                structure_name = ' '.join(action[1:-1])
                coords = action[-1].split(',')
                bx, by = int(coords[0]), int(coords[1])
                my_game.build_structure(structure_name, bx, by)
            except Exception:
                pass
            except (ValueError, IndexError): pass
        # Command [C] x,y: Claim a previously reconnoitered hex coordinate.
        if action[0] == 'c' and len(action) == 2:
            try:
                coords = action[1].split(',')
                my_game.claim_hex(int(coords[0]), int(coords[1]))
            except Exception: pass
            except (ValueError, IndexError): pass
        # Command [Flavor] <name>: Dynamically switch the kingdom's visual theme (e.g., swamp, icy).
        if action[0] in ['flavor', 'f'] and len(action) == 2:
            new_flavor = action[1]
            if new_flavor in FLAVORS:
                my_game.flavor = new_flavor
                my_game.style = FLAVORS[new_flavor]
                my_game.log.append(f"[!] Kingdom aesthetic shifted to {new_flavor.capitalize()}.")
            else:
                my_game.log.append(f"[!] Unknown flavor: {new_flavor}")
