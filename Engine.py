import os
import random
import threading
import time
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from data_libraries import FLAVORS, STRUCTURES_DB, PROMINENT_CITIZENS

console = Console()

class Pop:
    def __init__(self, name):
        self.name = name
        self.job = None
        self.starving = False

class Building:
    def __init__(self, b_type):
        self.type = b_type
        data = STRUCTURES_DB.get(b_type, {})
        self.capacity = data.get("capacity", 0)
        self.housing_capacity = data.get("housing_capacity", 0)
        self.production = data.get("production", {})
        self.workers = []

    def assign_worker(self, pop):
        if len(self.workers) < self.capacity and pop.job is None:
            self.workers.append(pop)
            pop.job = self
            return True
        return False

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
        from data_libraries import get_random_citizen
        self.pops = [Pop(get_random_citizen()) for _ in range(3)]
        self.buildings = []
        self.level = 1
        
        # Flavor Set Config
        self.style = FLAVORS[flavor]
        
        # World Generation (10x10)
        self.world = []
        self.generate_world()
        
        # Starting position (Heartland)
        self.start_x, self.start_y = 5, 5
        self.world[self.start_y][self.start_x].status = 2 # Capital is claimed
        self.log = [f"Expedition landed in the {flavor} regions.", "Capital founded."]


    def tick(self):
        from data_libraries import get_random_citizen

        # Calculate production
        produced_food = 0.0
        produced_bp = 0.0

        for building in self.buildings:
            if building.production and building.capacity > 0:
                efficiency = len(building.workers) / building.capacity
                prod_amount = building.production.get("base_rate", 0) * efficiency

                if building.production.get("type") == "food":
                    produced_food += prod_amount
                elif building.production.get("type") == "bp":
                    produced_bp += prod_amount

        self.food += produced_food
        self.bp += produced_bp

        # Consumption
        food_consumed = len(self.pops) * 1.0
        self.food -= food_consumed

        # Starvation
        if self.food < 0:
            for pop in self.pops:
                pop.starving = True
            self.log.append("[!] Your pops are starving!")
        else:
            for pop in self.pops:
                pop.starving = False

        # Migration
        max_housing = sum(b.housing_capacity for b in self.buildings)
        if len(self.pops) < max_housing:
            new_pop = Pop(get_random_citizen())
            self.pops.append(new_pop)
            self.log.append(f"[+] Migrant arrived: {new_pop.name}")

        # Draw UI after tick to update screen
        os.system('cls' if os.name == 'nt' else 'clear')
        draw_ui(self)
        print("\n> ", end="", flush=True) # reprint prompt

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
    stats.add_row("BP (Treasury):", str(int(game.bp)))
    stats.add_row("Food Stores:", str(int(game.food)))
    stats.add_row("Unrest:", str(game.unrest))
    stats.add_row("Kingdom XP:", str(game.xp))
    stats.add_row("Population:", str(len(game.pops)))
    
    layout["stats"].update(Panel(stats, title="Kingdom Ledger"))

    # Log Panel
    log_text = "\n".join(game.log[-5:])
    layout["footer"].update(Panel(f"{log_text}\nCommands: [R]econnoiter x,y | [C]laim x,y | [aa] Auto-Assign | [Q]uit", title="Log"))

    
    console.print(layout)

# --- Logic Phase ---
# Since you're a Floridian, I've defaulted it to Swamp flavor!
if __name__ == '__main__':
    my_game = Kingdom("The Sunken Glades", flavor="swamp")


    def game_loop(game):
        while True:
            time.sleep(5)
            game.tick()

    # Start background thread
    tick_thread = threading.Thread(target=game_loop, args=(my_game,), daemon=True)
    tick_thread.start()

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
        if action[0] == 'aa':
        # Auto-Assign
            unemployed = [p for p in my_game.pops if p.job is None]
            if not unemployed:
                my_game.log.append("[!] No unemployed pops to assign.")
                continue

            empty_slots = []
            for b in my_game.buildings:
                empty_slots.extend([b] * (b.capacity - len(b.workers)))

            if not empty_slots:
                my_game.log.append("[!] No empty building slots.")
                continue

        # Determine demand based on what resource we are lowest on relative to a baseline
        # Food is constantly consumed, so it usually has higher priority if low
            food_demand_score = 100 - my_game.food
            bp_demand_score = 100 - my_game.bp

        # Sort buildings by which resource they produce that we need the most
            def get_building_priority(b):
                if not b.production: return 0
                if b.production.get("type") == "food": return food_demand_score
                if b.production.get("type") == "bp": return bp_demand_score
                return 1

            empty_slots.sort(key=get_building_priority, reverse=True)

            assigned_count = 0
            while unemployed and empty_slots:
                pop = unemployed.pop(0)
                building = empty_slots.pop(0)
                if building.assign_worker(pop):
                    assigned_count += 1

            my_game.log.append(f"[+] Auto-assigned {assigned_count} pops.")
