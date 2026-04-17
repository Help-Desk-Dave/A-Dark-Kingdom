import os
import random
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from data_libraries import FLAVORS, STRUCTURES_DB, PROMINENT_CITIZENS, get_random_citizen

console = Console()

class Pop:
    def __init__(self, name):
        self.name = name
        self.hunger = 0
        self.happiness = 100
        self.is_alive = True

        # Determine alignment based on pathfinder (LG, NG, CG, LN, N, CN, LE, NE, CE)
        alignments = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"]
        self.alignment = random.choice(alignments)

        # Stats ranging from 8 to 18
        self.strength = random.randint(8, 18)
        self.intelligence = random.randint(8, 18)
        self.charisma = random.randint(8, 18)

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
        self.loyalty = 0
        
        # Flavor Set Config
        self.style = FLAVORS[flavor]
        
        # World Generation (10x10)
        self.world = []
        self.generate_world()
        
        # Starting position (Heartland)
        self.start_x, self.start_y = 5, 5
        self.world[self.start_y][self.start_x].status = 2 # Capital is claimed
        self.log = [f"Expedition landed in the {flavor} regions.", "Capital founded."]

        # Citizens and Advisors
        self.citizens = [Pop(get_random_citizen()) for _ in range(5)]
        self.advisors = {"general": None, "treasurer": None, "diplomat": None}

    def tick(self):
        """Monthly Tick: Updates stats based on advisors and triggers events."""
        self.log.append("--- A new month begins ---")

        # Passive Shield Mechanic
        if self.loyalty > 10 and self.unrest > 0:
            if random.random() < 0.5: # 50% chance
                self.unrest = max(0, self.unrest - 1)
                self.log.append("[+] High Loyalty automatically reduced Unrest by 1.")

        # Advisor Effects
        if self.advisors["treasurer"] and self.advisors["treasurer"].is_alive:
            bonus = self.advisors["treasurer"].intelligence // 4
            self.bp += bonus
            self.log.append(f"[+] Treasurer {self.advisors['treasurer'].name} collected {bonus} extra BP.")

        if self.advisors["general"] and self.advisors["general"].is_alive:
            reduction = self.advisors["general"].strength // 4
            if self.unrest > 0:
                self.unrest = max(0, self.unrest - reduction)
                self.log.append(f"[+] General {self.advisors['general'].name} reduced Unrest by {reduction}.")

        if self.advisors["diplomat"] and self.advisors["diplomat"].is_alive:
            boost = self.advisors["diplomat"].charisma // 4
            self.loyalty += boost
            self.log.append(f"[+] Diplomat {self.advisors['diplomat'].name} improved Loyalty by {boost}.")

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
    layout["main"].split_row(
        Layout(name="map", ratio=2),
        Layout(name="stats", ratio=1)
    )

    # Apply Flavor Visuals
    header_color = "green" if game.flavor == "swamp" else "cyan"
    layout["header"].update(Panel(f"👑 {game.name.upper()} | Flavor: {game.flavor.capitalize()}", style=f"bold {header_color}"))
    
    layout["map"].update(Panel(game.render_map(), title="World Map (Stolen Lands)", border_style=header_color))
    
    # Stats Table
    stats = Table.grid(expand=True)
    stats.add_row("BP (Treasury):", str(game.bp))
    stats.add_row("Unrest:", str(game.unrest))
    stats.add_row("Loyalty:", str(game.loyalty))
    stats.add_row("Kingdom XP:", str(game.xp))
    stats.add_row("", "")
    stats.add_row("[bold]Advisors:[/bold]", "")
    for role, pop in game.advisors.items():
        stats.add_row(f"{role.capitalize()}:", pop.name if pop else "None")

    stats.add_row("", "")
    stats.add_row("[bold]Citizens:[/bold]", "")
    for pop in game.citizens:
        stats.add_row(f"{pop.name}", f"S:{pop.strength} I:{pop.intelligence} C:{pop.charisma}")
    
    ledger_style = "red" if game.bp < 10 else "white"
    layout["stats"].update(Panel(stats, title="Kingdom Ledger", border_style=ledger_style))
    layout["footer"].update(Panel("Commands: [R]econnoiter x,y | [C]laim x,y | assign <role> <name> | [N]ext | [Q]uit"))
    
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
    if action[0] == 'n':
        my_game.tick()
    if action[0] == 'assign' and len(action) == 3:
        role = action[1].lower()
        pop_name = action[2].lower()

        if role in my_game.advisors:
            target_pop = next((p for p in my_game.citizens if p.name.lower() == pop_name), None)
            if target_pop:
                if target_pop.is_alive:
                    my_game.advisors[role] = target_pop
                    my_game.log.append(f"[+] Assigned {target_pop.name} to {role.capitalize()}.")
                else:
                    my_game.log.append(f"[-] {target_pop.name} is dead and cannot be an advisor.")
            else:
                my_game.log.append(f"[-] Could not find a citizen named {pop_name}.")
        else:
            my_game.log.append(f"[-] Invalid advisor role: {role}.")
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
