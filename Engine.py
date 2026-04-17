import os
import random
import threading
import time
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from library import STRUCTURES_DB, PROMINENT_CITIZENS, RECON_COST, CLAIM_COST, ANNUAL_UPKEEP, HOUSING_CAPACITY

# Define FLAVORS since it wasn't in library.py but was imported
FLAVORS = {
    "swamp": {"farm_art": " 🌾", "text_suffix": "in the swamp", "color": "green"},
    "forest": {"farm_art": " 🌲", "text_suffix": "in the forest", "color": "green"},
    "plain": {"farm_art": " 🌿", "text_suffix": "on the plains", "color": "yellow"},
    "mountain": {"farm_art": " ⛰️", "text_suffix": "in the mountains", "color": "white"}
}

console = Console()

class Settlement:
    def __init__(self, name="Unnamed Settlement"):
        self.name = name
        # 5x5 Grid for structures. None means empty.
        self.grid = [[None for _ in range(5)] for _ in range(5)]
        self.residential_lots = 0
        self.other_lots = 0

    @property
    def is_overcrowded(self):
        # Overcrowded if residential lots are less than 1 for every HOUSING_CAPACITY other lots
        return self.residential_lots < (self.other_lots // HOUSING_CAPACITY)

    def build(self, structure_name, x, y, logs):
        structure_name = structure_name.lower()
        if structure_name not in STRUCTURES_DB:
            logs.append(f"[-] Unknown structure: '{structure_name}'.")
            return False

        structure = STRUCTURES_DB[structure_name]
        lots_needed = structure["lots"]
        is_residential = "residential" in structure["traits"]

        # ---------------------------------------------------------
        # Text Note: Coordinate-check logic for Multi-Lot Buildings
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

class Hex:
    def __init__(self, terrain):
        self.terrain = terrain
        self.feature = None
        self.settlement = None
        # Status: 0 = Hidden (??), 1 = Reconnoitered (Terrain Visible), 2 = Claimed ([C])
        self.status = 0 
        self.building = None

class Kingdom:
    def __init__(self, name, flavor="swamp"):
        self.name = name
        self.flavor = flavor
        self.bp = 60 # Starting Build Points
        self.food = 40
        self.unrest = 0
        self.xp = 0
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
        # 1: Dark room, only 'establish camp'
        # 2: Camp established, limited UI
        # 3: UI fully revealed
        self.stage = 1

        # Starting position (Heartland)
        self.start_x, self.start_y = 5, 5
        self.world[self.start_y][self.start_x].status = 2 # Capital is claimed
        self.world[self.start_y][self.start_x].settlement = Settlement("Capital")
        self.log = [f"Expedition landed {self.style['text_suffix']}.", "Capital founded."]
        self.log = [f"Expedition landed {self.style['text_suffix']}.", "Awaiting orders to establish camp."]

    def tick(self):
        with self.lock:
            if self.stage < 3:
                return

            self.tick_count += 1

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
        for y in range(10):
            row = [Hex(random.choice(terrain_types)) for x in range(10)]
            self.world.append(row)

    def check_prominent_citizens(self):
        for citizen in PROMINENT_CITIZENS:
            name = citizen["name"]
            if name in self.spawned_citizens:
                continue

            trigger = citizen["trigger"]
            conditions_met = False

            if trigger == "Kingdom founded":
                conditions_met = True
            elif trigger == "Build a Pier":
                conditions_met = self.count_structures("pier") >= 1
            elif trigger == "Build a Lumberyard":
                conditions_met = self.count_structures("lumberyard") >= 1
            elif trigger == "Build a Manor/Craft Luxuries":
                conditions_met = self.count_structures("manor") >= 1
            elif trigger == "Build an Academy or Museum":
                conditions_met = self.count_structures("academy") >= 1 or self.count_structures("museum") >= 1
            elif trigger == "Build a Noble Villa":
                conditions_met = self.count_structures("noble villa") >= 1
            elif trigger == "Build 3 Breweries":
                conditions_met = self.count_structures("brewery") >= 3
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

    def monthly_tick(self):
        self.turn += 1
        self.log.append(f"--- Month {self.turn} Begins ---")
        self.check_prominent_citizens()

    def count_structures(self, structure_name):
        structure_name = structure_name.lower()
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

    def reconnoiter(self, x, y):
        """Note: Pathfinder Rule - Surveying a hex reveals its contents but costs resources."""
        if self.stage < 2: return
        # Treasurer's Warning: Using a check to prevent overspending
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
            else:
                self.log.append("[!] That area is already mapped.")
        else:
            self.log.append(f"[!] ({x},{y}) is out of bounds!")

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

        structure_name = structure_name.lower()
        if structure_name not in STRUCTURES_DB:
            self.log.append(f"[-] Unknown structure: '{structure_name}'.")
            return

        structure = STRUCTURES_DB[structure_name]
        cost = structure["cost_rp"]

        # Block purchase if insufficient funds
        if self.bp < cost:
            self.log.append(f"[-] Treasurer: 'We cannot afford {structure_name.capitalize()}! Cost: {cost} BP, Have: {self.bp} BP.'")
            return

        # Treasurer's Warning - Using < 15 instead of < 10 to match requested spec
        if self.bp - cost < 15:
            os.system('cls' if os.name == 'nt' else 'clear')
            draw_ui(self)
            warning_panel = Panel(
                f"[bold red]WARNING: Building '{structure_name.capitalize()}' will drop the treasury below 15 BP![/]\n"
                f"Current BP: {self.bp}\nCost: {cost}\nRemaining BP: {self.bp - cost}\n\n"
                f"Type 'yes' to confirm this purchase, or any other key to cancel.",
                title="Treasurer's Warning",
                border_style="bold red"
            )
            console.print(warning_panel)
            confirmation = input("> ").strip().lower()
            if confirmation != 'yes':
                self.log.append("[-] Treasurer: 'A wise choice to hold our funds, my liege.'")
                return

        # Attempt to build
        success = hex_obj.settlement.build(structure_name, x, y, self.log)
        if success:
            self.bp -= cost
            if self.stage == 2 and structure_name == "houses":
                self.stage = 3
                self.log.append("[!] Citizens arrive and build houses. The Kingdom expands!")

    def claim_hex(self, x, y):
        """Note: You must Reconnoiter a hex (status 1) before you can Claim it (status 2)."""
        if self.stage < 2: return
        cost = CLAIM_COST

        if not (0 <= x < 10 and 0 <= y < 10):
            self.log.append(f"[!] ({x},{y}) is out of bounds!")
            return

        # Guardrail check
        if self.bp - cost < 0:
            self.log.append("[-] Treasurer: 'Claiming land requires BP we don't have.'")
            return
        elif self.bp - cost < 15:
             self.log.append("[-] Treasurer WARNING: Funds are critically low! Reconsidering claim.")
             return

        if self.world[y][x].status == 1:
            self.bp -= cost
            self.world[y][x].status = 2
            self.xp += 10 # Milestone: 10 XP per hex
            self.log.append(f"[+] Claimed ({x},{y}). Kingdom Size +1.")
        else:
            self.log.append("[!] You must map this area before claiming it!")

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
                    map_display.append(" [C]", style="bold gold1")
            map_display.append("\n")
        return map_display

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
    
    if game.current_view == "world":
        layout["main"]["map_and_stats"]["map"].update(Panel(game.render_map(), title="World Map (Stolen Lands)", border_style=header_color))
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

    if game.stage >= 3:
        stats.add_row("BP (Treasury):", str(game.bp))
        stats.add_row("Unrest:", str(game.unrest))
        stats.add_row("Kingdom XP:", str(game.xp))

        if game.current_view != "world":
            sx, sy = game.current_view
            if game.world[sy][sx].settlement:
                settlement = game.world[sy][sx].settlement
                stats.add_row("---", "---")
                stats.add_row("Res. Lots:", str(settlement.residential_lots))
                stats.add_row("Other Lots:", str(settlement.other_lots))
    else:
         stats.add_row("BP (Treasury):", "???")
         stats.add_row("Unrest:", "???")
         stats.add_row("Kingdom XP:", "???")
    
    layout["stats"].update(Panel(stats, title="Kingdom Ledger"))
    layout["footer"].update(Panel("Commands: [R]econnoiter x,y | [C]laim x,y | [V]iew x,y / world | [B]uild <name> x,y | Flavor <name> | [N]ext | [Q]uit"))

    # Render log
    log_content = "\n".join(game.log[-5:])
    layout["log"].update(Panel(log_content, title="Event Log", border_style="white"))

    if game.stage == 1:
        layout["footer"].update(Panel("Commands: [E]stablish Camp | [Q]uit"))
    elif game.stage == 2:
        layout["footer"].update(Panel("Commands: [V]iew x,y | [B]uild <structure> x,y | [Q]uit"))
    else:
        layout["footer"].update(Panel("Commands: [V]iew x,y | [R]econnoiter x,y | [C]laim x,y | [B]uild <structure> x,y | [Q]uit"))
    
    console.print(layout)

def simulation_loop(game):
    while True:
        time.sleep(5)
        game.tick()
        # In a real CLI, we might need a better way to refresh the UI asynchronously.
        # For now, it refreshes on input.

# --- Logic Phase ---
# Since you're a Floridian, I've defaulted it to Swamp flavor!
if __name__ == "__main__":
    my_game = Kingdom("The Sunken Glades", flavor="swamp")

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        draw_ui(my_game)

        action = input("\n> ").lower().split()
        if not action: continue

        if action[0] == 'q': break
        if action[0] in ['n', 'next']:
            my_game.monthly_tick()
        if action[0] == 'r' and len(action) == 2:
            try:
                coords = action[1].split(',')
                my_game.reconnoiter(int(coords[0]), int(coords[1]))
            except (ValueError, IndexError):
                pass
        if action[0] == "v" and len(action) == 2:
            if action[1] == "world":
                my_game.current_view = "world"
                my_game.log.append("[+] Viewing World Map.")
            else:
                try:
                    coords = action[1].split(",")
                    vx, vy = int(coords[0]), int(coords[1])
                    if 0 <= vx < 10 and 0 <= vy < 10:
                        my_game.current_view = (vx, vy)
                        my_game.log.append(f"[+] Viewing Settlement at ({vx},{vy}).")
                    else:
                        my_game.log.append("[-] Out of bounds.")
                except (ValueError, IndexError):
                    my_game.log.append("[-] Invalid coordinates.")
        if action[0] == "b" and len(action) == 3:
            structure = action[1]
            try:
                coords = action[2].split(",")
                x, y = int(coords[0]), int(coords[1])
                my_game.build_structure(structure, x, y)
            except (ValueError, IndexError):
                pass
        if action[0] == 'c' and len(action) == 2:
            try:
                coords = action[1].split(',')
                my_game.claim_hex(int(coords[0]), int(coords[1]))
            except (ValueError, IndexError): pass
