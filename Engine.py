import os
import random
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from library import STRUCTURES_DB, PROMINENT_CITIZENS

# Define FLAVORS since it wasn't in library.py but was imported
FLAVORS = {
    "swamp": {"farm_art": " 🌾"},
    "forest": {"farm_art": " 🌲"},
    "plain": {"farm_art": " 🌿"},
    "mountain": {"farm_art": " ⛰️"}
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
        # Overcrowded if residential lots are less than 1 for every 4 other lots
        return self.residential_lots < (self.other_lots // 4)

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
        
        # Flavor Set Config
        self.style = FLAVORS[flavor]
        
        # World Generation (10x10)
        self.world = []
        self.generate_world()
        
        # View state: "world" or a tuple like (5, 5) for a specific hex's settlement
        self.current_view = "world"

        # Starting position (Heartland)
        self.start_x, self.start_y = 5, 5
        capital_hex = self.world[self.start_y][self.start_x]
        capital_hex.status = 2 # Capital is claimed
        capital_hex.settlement = Settlement("Capital")
        self.log = [f"Expedition landed in the {flavor} regions.", "Capital founded."]

    def generate_world(self):
        """Note: Uses a simple nested loop to fill the map with random terrain types."""
        terrain_types = ["Forest", "Plain", "Mountain", "Hill", "Swamp"]
        for y in range(10):
            row = [Hex(random.choice(terrain_types)) for x in range(10)]
            self.world.append(row)

    def reconnoiter(self, x, y):
        """Note: Pathfinder Rule - Surveying a hex reveals its contents but costs resources."""
        # Treasurer's Warning: Using a check to prevent overspending
        cost = 5
        if self.bp < cost:
            self.log.append("[-] Treasurer: 'We literally cannot afford to map that area right now.'")
            return

        if 0 <= x < 10 and 0 <= y < 10:
            if self.world[y][x].status == 0:
                self.bp -= cost
                self.world[y][x].status = 1
                self.log.append(f"[+] Reconnoitered ({x},{y}). It is a {self.world[y][x].terrain}.")
            else:
                self.log.append("[!] That area is already mapped.")

    def build_structure(self, structure_name, x, y):
        # We need to be viewing a settlement to build
        if self.current_view == "world":
            self.log.append("[!] You must be viewing a settlement to build. Use [V]iew x,y.")
            return

        sx, sy = self.current_view
        hex_obj = self.world[sy][sx]
        if hex_obj.settlement is None:
            self.log.append("[!] No settlement exists here to build in.")
            return

        structure_name = structure_name.lower()
        if structure_name not in STRUCTURES_DB:
            self.log.append(f"[-] Unknown structure: '{structure_name}'.")
            return

        structure = STRUCTURES_DB[structure_name]
        cost = structure["cost_rp"]

        # Treasurer's Warning
        if self.bp - cost < 10:
            os.system('cls' if os.name == 'nt' else 'clear')
            draw_ui(self)
            warning_panel = Panel(
                f"[bold red]WARNING: Building '{structure_name.capitalize()}' will drop the treasury below 10 BP![/]\n"
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

    def claim_hex(self, x, y):
        """Note: You must Reconnoiter a hex (status 1) before you can Claim it (status 2)."""
        cost = 10
        if self.world[y][x].status == 1:
            if self.bp >= cost:
                self.bp -= cost
                self.world[y][x].status = 2
                self.xp += 10 # Milestone: 10 XP per hex
                self.log.append(f"[+] Claimed ({x},{y}). Kingdom Size +1.")
            else:
                self.log.append("[-] Treasurer: 'Claiming land requires BP we don't have.'")
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
                    char = self.style["farm_art"] if hex_obj.terrain == "Swamp" else " . "
                    map_display.append(char, style="green")
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
    header_color = "green" if game.flavor == "swamp" else "cyan"
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
    
    layout["main"]["map_and_stats"]["stats"].update(Panel(stats, title="Kingdom Ledger"))

    # Log Table
    log_text = Text("\n".join(game.log[-5:])) # Show last 5 logs
    layout["main"]["log"].update(Panel(log_text, title="Log"))

    layout["footer"].update(Panel("Commands: [R]econnoiter x,y | [C]laim x,y | [V]iew x,y (or 'world') | [B]uild <struct> x,y | [Q]uit"))
    
    console.print(layout)

# --- Logic Phase ---
# Since you're a Floridian, I've defaulted it to Swamp flavor!
my_game = Kingdom("The Sunken Glades", flavor="swamp")

while True:
    os.system('cls' if os.name == 'nt' else 'clear')
    draw_ui(my_game)
    
    action = input("\n> ").lower().split()
    if not action: continue
    
    if action[0] == 'q': break
    if action[0] == 'r' and len(action) == 2:
        try:
            coords = action[1].split(',')
            my_game.reconnoiter(int(coords[0]), int(coords[1]))
        except: pass
    if action[0] == 'c' and len(action) == 2:
        try:
            coords = action[1].split(',')
            my_game.claim_hex(int(coords[0]), int(coords[1]))
        except: pass
    if action[0] == 'v' and len(action) == 2:
        if action[1].lower() == 'world':
            my_game.current_view = "world"
        else:
            try:
                coords = action[1].split(',')
                vx, vy = int(coords[0]), int(coords[1])
                if 0 <= vx < 10 and 0 <= vy < 10:
                    my_game.current_view = (vx, vy)
                else:
                    my_game.log.append("[!] Coordinates out of bounds.")
            except: pass
    if action[0] == 'b' and len(action) >= 3:
        try:
            # action is like ['b', 'academy', '1,1'] or ['b', 'general', 'store', '1,1']
            coords_str = action[-1]
            coords = coords_str.split(',')
            bx, by = int(coords[0]), int(coords[1])
            structure_name = " ".join(action[1:-1])
            my_game.build_structure(structure_name, bx, by)
        except: pass
