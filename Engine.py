import os
import random
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from data_libraries import FLAVORS, STRUCTURES_DB, PROMINENT_CITIZENS

console = Console()

class Hex:
    def __init__(self, terrain):
        self.terrain = terrain
        self.feature = None
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
        
        # Starting position (Heartland)
        self.start_x, self.start_y = 5, 5
        self.world[self.start_y][self.start_x].status = 2 # Capital is claimed
        self.log = [f"Expedition landed {self.style['text_suffix']}.", "Capital founded."]

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
        else:
            self.log.append(f"[!] ({x},{y}) is out of bounds!")

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
    layout["main"].split_row(
        Layout(name="map", ratio=2),
        Layout(name="stats", ratio=1)
    )

    # Apply Flavor Visuals
    header_color = game.style["color"]
    layout["header"].update(Panel(f"👑 {game.name.upper()} | Flavor: {game.flavor.capitalize()}", style=f"bold {header_color}"))
    
    layout["map"].update(Panel(game.render_map(), title="World Map (Stolen Lands)", border_style=header_color))
    
    # Stats Table
    stats = Table.grid(expand=True)
    stats.add_row("BP (Treasury):", str(game.bp))
    stats.add_row("Unrest:", str(game.unrest))
    stats.add_row("Kingdom XP:", str(game.xp))
    
    layout["stats"].update(Panel(stats, title="Kingdom Ledger"))
    layout["footer"].update(Panel("Commands: [R]econnoiter x,y | [C]laim x,y | Flavor <name> | [N]ext | [Q]uit"))
    
    console.print(layout)

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
        if action[0] == 'r' and len(action) == 2:
            try:
                coords = action[1].split(',')
                my_game.reconnoiter(int(coords[0]), int(coords[1]))
            except (ValueError, IndexError):
                pass
        if action[0] == 'c' and len(action) == 2:
            try:
                coords = action[1].split(',')
                my_game.claim_hex(int(coords[0]), int(coords[1]))
            except (ValueError, IndexError):
                pass
        if action[0] in ['flavor', 'f'] and len(action) == 2:
            new_flavor = action[1]
            if new_flavor in FLAVORS:
                my_game.flavor = new_flavor
                my_game.style = FLAVORS[new_flavor]
                my_game.log.append(f"[!] Kingdom aesthetic shifted to {new_flavor.capitalize()}.")
            else:
                my_game.log.append(f"[!] Unknown flavor: {new_flavor}")
